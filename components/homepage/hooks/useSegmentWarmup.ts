'use client'

import { useEffect, useRef } from 'react'
import type { LandingAssetId, LandingSegmentId } from '@/lib/landing/mediaManifest'
import { getWarmupAssetIdsForSegment } from '@/lib/landing/preloadPolicy'

type UseSegmentWarmupOptions = {
  activeSegmentId: LandingSegmentId | null
  enabled: boolean
  warmAssets: (assetIds: LandingAssetId[]) => Promise<void>
}

export function useSegmentWarmup({
  activeSegmentId,
  enabled,
  warmAssets,
}: UseSegmentWarmupOptions) {
  const warmedAssetIdsRef = useRef<Set<LandingAssetId>>(new Set())

  useEffect(() => {
    if (!enabled || !activeSegmentId) return

    const candidateAssetIds = getWarmupAssetIdsForSegment(activeSegmentId).filter(
      (assetId) => !warmedAssetIdsRef.current.has(assetId)
    )

    if (candidateAssetIds.length === 0) return

    candidateAssetIds.forEach((assetId) => warmedAssetIdsRef.current.add(assetId))
    warmAssets(candidateAssetIds).catch(() => undefined)
  }, [activeSegmentId, enabled, warmAssets])
}
