import type { LandingMediaMode } from '@/lib/landing/core/contracts'
import type { LandingSegmentConfig, LandingSceneManifest } from '@/lib/landing/scenes/sceneTypes'
import { getCriticalLandingSegments } from '@/lib/landing/scenes/sceneSelectors'
import type { LandingMediaPolicy } from '@/lib/landing/tier/tierTypes'

export type LandingMediaPreloadRequest = {
  assetId: NonNullable<LandingSegmentConfig['media']['assetId'] | LandingSegmentConfig['media']['posterAssetId']>
  targetReadiness: LandingMediaPolicy['initialReadinessTarget']
}

export function resolveEffectiveMediaMode(
  mode: LandingMediaMode,
  policy: LandingMediaPolicy
): LandingMediaMode {
  if (!policy.allowVideo || policy.preferPoster) {
    return 'poster'
  }

  if (mode === 'scrub' && !policy.allowScrub) {
    return 'hold'
  }

  return mode
}

export function getCriticalMediaRequests(
  manifest: LandingSceneManifest,
  policy: LandingMediaPolicy
): LandingMediaPreloadRequest[] {
  return getCriticalLandingSegments(manifest)
    .map((segment) => {
      const assetId =
        resolveEffectiveMediaMode(segment.media.mode, policy) === 'poster'
          ? (segment.media.posterAssetId ?? segment.media.assetId)
          : segment.media.assetId

      if (!assetId) {
        return null
      }

      return {
        assetId,
        targetReadiness: policy.initialReadinessTarget,
      }
    })
    .filter((request): request is LandingMediaPreloadRequest => request !== null)
}
