'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createLandingAssetStateMap,
  loadLandingAsset,
  type LandingAssetLoadResult,
  type LandingAssetLoadStrategy,
  type LandingAssetState,
  type LandingAssetStateMap,
} from '@/lib/landing/assetStore'
import type { LandingAssetId, LandingDeviceProfile } from '@/lib/landing/mediaManifest'
import { getCriticalLandingAssetIds } from '@/lib/landing/preloadPolicy'

type CriticalProgress = {
  loaded: number
  total: number
  failed: number
}

export function useLandingAssetStore(deviceProfile: LandingDeviceProfile | null) {
  const [assets, setAssets] = useState<LandingAssetStateMap | null>(null)
  const [criticalProgress, setCriticalProgress] = useState<CriticalProgress>({
    loaded: 0,
    total: getCriticalLandingAssetIds().length,
    failed: 0,
  })
  const assetsRef = useRef<LandingAssetStateMap | null>(null)
  const objectUrlsRef = useRef<Record<LandingAssetId, string>>({} as Record<LandingAssetId, string>)
  const inflightRef = useRef<Partial<Record<LandingAssetId, Promise<LandingAssetLoadResult>>>>({})

  useEffect(() => {
    assetsRef.current = assets
  }, [assets])

  useEffect(() => {
    if (!deviceProfile) return

    Object.values(objectUrlsRef.current).forEach((url) => URL.revokeObjectURL(url))
    objectUrlsRef.current = {} as Record<LandingAssetId, string>
    inflightRef.current = {}

    const initialAssets = createLandingAssetStateMap(deviceProfile)
    assetsRef.current = initialAssets
    setAssets(initialAssets)
    setCriticalProgress({
      loaded: 0,
      total: getCriticalLandingAssetIds().length,
      failed: 0,
    })
  }, [deviceProfile])

  useEffect(() => {
    return () => {
      Object.values(objectUrlsRef.current).forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current = {} as Record<LandingAssetId, string>
    }
  }, [])

  const commitAssetState = useCallback(
    (
      assetId: LandingAssetId,
      updater: (current: LandingAssetState) => LandingAssetState
    ): LandingAssetState | null => {
      if (!assetsRef.current) return null

      const nextAssets = {
        ...assetsRef.current,
        [assetId]: updater(assetsRef.current[assetId]),
      }

      assetsRef.current = nextAssets
      setAssets(nextAssets)
      return nextAssets[assetId]
    },
    []
  )

  const ensureAsset = useCallback(
    (assetId: LandingAssetId, strategy: LandingAssetLoadStrategy) => {
      if (!deviceProfile || !assetsRef.current) {
        return Promise.resolve<LandingAssetLoadResult>({ status: 'failed', failureReason: 'error' })
      }

      const currentAsset = assetsRef.current[assetId]
      if (currentAsset.status === 'ready') {
        return Promise.resolve({ status: 'ready', resolvedSrc: currentAsset.resolvedSrc })
      }

      const inflight = inflightRef.current[assetId]
      if (inflight) {
        return inflight
      }

      commitAssetState(assetId, (asset) => ({
        ...asset,
        status: 'loading',
        strategy,
        failureReason: undefined,
      }))

      const promise = loadLandingAsset(assetId, deviceProfile, strategy)
      inflightRef.current[assetId] = promise

      promise
        .then((result) => {
          commitAssetState(assetId, (asset) => {
            const previousResolved = objectUrlsRef.current[assetId]
            if (previousResolved && previousResolved !== result.resolvedSrc) {
              URL.revokeObjectURL(previousResolved)
              delete objectUrlsRef.current[assetId]
            }

            if (result.status === 'ready' && result.resolvedSrc) {
              objectUrlsRef.current[assetId] = result.resolvedSrc
            }

            return {
              ...asset,
              status: result.status,
              strategy,
              resolvedSrc: result.status === 'ready' ? result.resolvedSrc ?? asset.resolvedSrc : undefined,
              failureReason: result.failureReason,
            }
          })
        })
        .finally(() => {
          delete inflightRef.current[assetId]
        })

      return promise
    },
    [commitAssetState, deviceProfile]
  )

  const ensureCritical = useCallback(async () => {
    const criticalIds = getCriticalLandingAssetIds()
    let loaded = 0
    let failed = 0

    const results = await Promise.all(
      criticalIds.map(async (assetId) => {
        const result = await ensureAsset(assetId, 'strict')
        if (result.status === 'ready') {
          loaded += 1
        } else {
          failed += 1
        }

        setCriticalProgress({
          loaded: loaded + failed,
          total: criticalIds.length,
          failed,
        })

        return result
      })
    )

    return results
  }, [ensureAsset])

  const warmAssets = useCallback(
    async (assetIds: LandingAssetId[]) => {
      await Promise.all(assetIds.map((assetId) => ensureAsset(assetId, 'background')))
    },
    [ensureAsset]
  )

  const criticalReady = useMemo(() => {
    if (!assets) return false
    return getCriticalLandingAssetIds().every((assetId) => assets[assetId].status === 'ready')
  }, [assets])

  return {
    assets,
    criticalProgress,
    criticalReady,
    ensureCritical,
    warmAssets,
  }
}
