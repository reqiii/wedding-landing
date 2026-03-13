import type { LandingAssetId, LandingMediaMode, LandingReadyTarget } from '@/lib/landing/core/contracts'
import {
  getLandingAssetDefinition,
  getLandingAssetSource,
  getLandingPosterSource,
} from '@/lib/landing/mediaManifest'
import {
  getCriticalMediaRequests,
  getDeferredMediaRequests,
  resolveEffectiveMediaMode,
  resolveMediaTargetReadiness,
} from '@/lib/landing/media/mediaPolicy'
import type { LandingSceneManifest, LandingSegmentConfig, LandingSegmentId } from '@/lib/landing/scenes/sceneTypes'
import type { LandingMediaPolicy } from '@/lib/landing/tier/tierTypes'

export type LandingResolvedAsset = {
  assetId: LandingAssetId
  kind: ReturnType<typeof getLandingAssetDefinition>['kind']
  src: string
  posterSrc: string
}

export type LandingResolvedSegmentMedia = {
  sceneId: LandingSceneManifest['id']
  segmentId: LandingSegmentId
  requestedMode: LandingMediaMode
  effectiveMode: LandingMediaMode
  targetReadiness: LandingReadyTarget
  preloadPriority: LandingSegmentConfig['preloadHint']['priority']
  tierCompatible: boolean
  activeAsset: LandingResolvedAsset | null
  posterAsset: LandingResolvedAsset | null
  warmupTargets: LandingAssetId[]
}

export type LandingAssetRegistry = {
  getAsset: (assetId: LandingAssetId, policy: LandingMediaPolicy) => LandingResolvedAsset
  resolveSegment: (
    segment: LandingSegmentConfig,
    policy: LandingMediaPolicy
  ) => LandingResolvedSegmentMedia
  getCriticalRequests: (policy: LandingMediaPolicy) => {
    assetId: LandingAssetId
    targetReadiness: LandingReadyTarget
    priority: LandingSegmentConfig['preloadHint']['priority']
  }[]
  getDeferredRequests: (policy: LandingMediaPolicy) => {
    assetId: LandingAssetId
    targetReadiness: LandingReadyTarget
    priority: LandingSegmentConfig['preloadHint']['priority']
  }[]
}

export function createLandingAssetRegistry(
  manifest: LandingSceneManifest
): LandingAssetRegistry {
  const assetCache = new Map<string, LandingResolvedAsset>()

  const resolveVideoSourceProfile = (policy: LandingMediaPolicy) => {
    switch (policy.tier) {
      case 'tier-1-hold':
        return 'mobile'
      case 'tier-2-balanced':
      case 'tier-3-premium':
        return 'desktop'
      default:
        return policy.deviceProfile
    }
  }

  const getAsset = (assetId: LandingAssetId, policy: LandingMediaPolicy): LandingResolvedAsset => {
    const cacheKey = `${assetId}:${policy.tier}:${policy.deviceProfile}`
    const cached = assetCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const definition = getLandingAssetDefinition(assetId)
    const sourceProfile =
      definition.kind === 'video' ? resolveVideoSourceProfile(policy) : policy.deviceProfile
    const asset: LandingResolvedAsset = {
      assetId,
      kind: definition.kind,
      src: getLandingAssetSource(assetId, sourceProfile),
      posterSrc:
        getLandingPosterSource(assetId, policy.deviceProfile) ??
        getLandingAssetSource(assetId, sourceProfile),
    }

    assetCache.set(cacheKey, asset)
    return asset
  }

  const resolveSegment = (
    segment: LandingSegmentConfig,
    policy: LandingMediaPolicy
  ): LandingResolvedSegmentMedia => {
    const tierCompatible = segment.tierCompatibility.includes(policy.tier)
    const effectiveMode = resolveEffectiveMediaMode(segment.media.mode, policy, tierCompatible)
    const posterAssetId = segment.media.posterAssetId ?? segment.media.assetId ?? null
    const activeAssetId =
      effectiveMode === 'poster'
        ? posterAssetId
        : segment.media.assetId ?? posterAssetId

    return {
      sceneId: manifest.id,
      segmentId: segment.id,
      requestedMode: segment.media.mode,
      effectiveMode,
      targetReadiness: resolveMediaTargetReadiness(
        segment.preloadHint.targetReadiness,
        effectiveMode,
        policy
      ),
      preloadPriority: segment.preloadHint.priority,
      tierCompatible,
      activeAsset: activeAssetId ? getAsset(activeAssetId, policy) : null,
      posterAsset: posterAssetId ? getAsset(posterAssetId, policy) : null,
      warmupTargets: segment.warmupHint?.targets ?? [],
    }
  }

  return {
    getAsset,
    resolveSegment,
    getCriticalRequests(policy) {
      return getCriticalMediaRequests(manifest, policy)
    },
    getDeferredRequests(policy) {
      return getDeferredMediaRequests(manifest, policy)
    },
  }
}
