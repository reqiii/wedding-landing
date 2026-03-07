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
  completed: number
  loaded: number
  total: number
  failed: number
}

type UseLandingAssetStoreOptions = {
  useNativeStrictVideo?: boolean
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>
) {
  if (items.length === 0) return

  const workerLimit = Math.max(1, Math.min(limit, items.length))
  let cursor = 0

  await Promise.all(
    Array.from({ length: workerLimit }, async () => {
      while (cursor < items.length) {
        const currentIndex = cursor
        cursor += 1
        await task(items[currentIndex])
      }
    })
  )
}

export function useLandingAssetStore(
  deviceProfile: LandingDeviceProfile | null,
  options: UseLandingAssetStoreOptions = {}
) {
  const { useNativeStrictVideo = false } = options
  const [assets, setAssets] = useState<LandingAssetStateMap | null>(null)
  const [criticalProgress, setCriticalProgress] = useState<CriticalProgress>({
    completed: 0,
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
      completed: 0,
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
        return Promise.resolve<LandingAssetLoadResult>({
          status: 'ready',
          resolvedSrc: currentAsset.resolvedSrc,
        })
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
    let completed = 0
    let loaded = 0
    let failed = 0

    const results: LandingAssetLoadResult[] = new Array(criticalIds.length)
    const concurrencyLimit = useNativeStrictVideo ? 1 : criticalIds.length

    await runWithConcurrency(criticalIds, concurrencyLimit, async (assetId) => {
      const result = await ensureAsset(
        assetId,
        useNativeStrictVideo && assetId !== 'logo' ? 'strict-native' : 'strict'
      )
      const resultIndex = criticalIds.indexOf(assetId)
      results[resultIndex] = result
      completed += 1
      if (result.status === 'ready') {
        loaded += 1
      } else {
        failed += 1
      }

      setCriticalProgress({
        completed,
        loaded,
        total: criticalIds.length,
        failed,
      })
    })

    return results
  }, [ensureAsset, useNativeStrictVideo])

  const warmAssets = useCallback(
    async (assetIds: LandingAssetId[]) => {
      const uniqueAssetIds = Array.from(new Set(assetIds))
      const concurrencyLimit = useNativeStrictVideo ? 1 : Math.min(2, uniqueAssetIds.length)

      await runWithConcurrency(uniqueAssetIds, concurrencyLimit, async (assetId) => {
        await ensureAsset(assetId, 'background')
      })
    },
    [ensureAsset, useNativeStrictVideo]
  )

  const criticalReady = useMemo(() => {
    if (!assets) return false
    return getCriticalLandingAssetIds().every((assetId) => assets[assetId].status === 'ready')
  }, [assets])

  const criticalComplete = useMemo(
    () => criticalProgress.completed >= criticalProgress.total && criticalProgress.total > 0,
    [criticalProgress.completed, criticalProgress.total]
  )

  return {
    assets,
    criticalProgress,
    criticalComplete,
    criticalReady,
    ensureCritical,
    warmAssets,
  }
}
