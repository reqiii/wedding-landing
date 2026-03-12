import type { LandingMediaMode, LandingReadyTarget } from '@/lib/landing/core/contracts'
import type { LandingSegmentConfig, LandingSceneManifest } from '@/lib/landing/scenes/sceneTypes'
import type { LandingMediaPolicy } from '@/lib/landing/tier/tierTypes'
import { maxReadinessTarget, minReadinessTarget } from '@/lib/landing/media/readinessMachine'

export type LandingMediaPreloadRequest = {
  assetId: NonNullable<LandingSegmentConfig['media']['assetId'] | LandingSegmentConfig['media']['posterAssetId']>
  targetReadiness: LandingReadyTarget
  priority: LandingSegmentConfig['preloadHint']['priority']
}

export type LandingScrubSettings = {
  enabled: boolean
  progressEpsilon: number
  timeEpsilonSeconds: number
  minSeekIntervalMs: number
  decodeLagGraceMs: number
  maxDecodeLagEvents: number
  useVideoFrameCallback: boolean
}

export function resolveEffectiveMediaMode(
  mode: LandingMediaMode,
  policy: LandingMediaPolicy,
  tierCompatible = true
): LandingMediaMode {
  if (!tierCompatible || !policy.allowVideo || policy.preferPoster) {
    return 'poster'
  }

  if (mode === 'scrub' && !policy.allowScrub) {
    return 'hold'
  }

  return mode
}

function resolvePolicyPreloadTarget(policy: LandingMediaPolicy): LandingReadyTarget {
  switch (policy.preloadStrategy) {
    case 'poster':
      return 'poster-ready'
    case 'metadata':
      return 'metadata-ready'
    case 'first-frame':
    default:
      return 'first-frame-ready'
  }
}

export function resolveMediaTargetReadiness(
  requestedTarget: LandingReadyTarget,
  effectiveMode: LandingMediaMode,
  policy: LandingMediaPolicy
) {
  if (effectiveMode === 'poster') {
    return 'poster-ready'
  }

  const policyTarget = resolvePolicyPreloadTarget(policy)
  return minReadinessTarget(maxReadinessTarget(requestedTarget, policy.initialReadinessTarget), policyTarget)
}

export function getSegmentPreloadRequest(
  segment: LandingSegmentConfig,
  policy: LandingMediaPolicy
): LandingMediaPreloadRequest | null {
  const effectiveMode = resolveEffectiveMediaMode(
    segment.media.mode,
    policy,
    segment.tierCompatibility.includes(policy.tier)
  )
  const assetId =
    effectiveMode === 'poster'
      ? (segment.media.posterAssetId ?? segment.media.assetId)
      : segment.media.assetId ?? segment.media.posterAssetId

  if (!assetId) {
    return null
  }

  return {
    assetId,
    targetReadiness: resolveMediaTargetReadiness(
      segment.preloadHint.targetReadiness,
      effectiveMode,
      policy
    ),
    priority: segment.preloadHint.priority,
  }
}

export function getCriticalMediaRequests(
  manifest: LandingSceneManifest,
  policy: LandingMediaPolicy
) {
  const seen = new Set<string>()

  return manifest.segments
    .filter((segment) => segment.preloadHint.priority === 'critical')
    .map((segment) => getSegmentPreloadRequest(segment, policy))
    .filter((request): request is LandingMediaPreloadRequest => {
      if (!request || seen.has(request.assetId)) {
        return false
      }

      seen.add(request.assetId)
      return true
    })
}

export function getInitialRevealMediaRequests(
  manifest: LandingSceneManifest,
  policy: LandingMediaPolicy
) {
  const initialSegment = manifest.segments[0]
  if (!initialSegment) {
    return []
  }

  const requests: LandingMediaPreloadRequest[] = []
  const appendRequest = (
    assetId: LandingMediaPreloadRequest['assetId'],
    targetReadiness: LandingReadyTarget,
    priority: LandingMediaPreloadRequest['priority']
  ) => {
    const existing = requests.find((request) => request.assetId === assetId)
    if (existing) {
      existing.targetReadiness = maxReadinessTarget(existing.targetReadiness, targetReadiness)
      return
    }

    requests.push({
      assetId,
      targetReadiness,
      priority,
    })
  }

  const segmentRequest = getSegmentPreloadRequest(initialSegment, policy)
  if (segmentRequest) {
    appendRequest(
      segmentRequest.assetId,
      maxReadinessTarget(segmentRequest.targetReadiness, policy.initialReadinessTarget),
      'critical'
    )
  }

  const posterAssetId = initialSegment.media.posterAssetId ?? initialSegment.media.assetId
  if (posterAssetId) {
    appendRequest(posterAssetId, 'poster-ready', 'critical')
  }

  return requests
}

export function getDeferredMediaRequests(
  manifest: LandingSceneManifest,
  policy: LandingMediaPolicy
) {
  const seen = new Set<string>()

  return manifest.segments
    .filter((segment) => segment.preloadHint.priority !== 'critical')
    .map((segment) => getSegmentPreloadRequest(segment, policy))
    .filter((request): request is LandingMediaPreloadRequest => {
      if (!request || seen.has(request.assetId)) {
        return false
      }

      seen.add(request.assetId)
      return true
    })
}

export function getWarmupTargetReadiness(policy: LandingMediaPolicy): LandingReadyTarget {
  return resolvePolicyPreloadTarget(policy)
}

export function shouldUseStandbyPlane(policy: LandingMediaPolicy) {
  return policy.allowVideo && policy.standbyPoolSize > 0
}

export function getScrubSettings(policy: LandingMediaPolicy): LandingScrubSettings {
  if (!policy.allowVideo || !policy.allowScrub) {
    return {
      enabled: false,
      progressEpsilon: Number.POSITIVE_INFINITY,
      timeEpsilonSeconds: Number.POSITIVE_INFINITY,
      minSeekIntervalMs: Number.POSITIVE_INFINITY,
      decodeLagGraceMs: 0,
      maxDecodeLagEvents: 0,
      useVideoFrameCallback: false,
    }
  }

  if (policy.tier === 'tier-2-balanced') {
    return {
      enabled: true,
      progressEpsilon: 0.02,
      timeEpsilonSeconds: 0.08,
      minSeekIntervalMs: 90,
      decodeLagGraceMs: 180,
      maxDecodeLagEvents: 2,
      useVideoFrameCallback: true,
    }
  }

  return {
    enabled: true,
    progressEpsilon: 0.008,
    timeEpsilonSeconds: 0.04,
    minSeekIntervalMs: 32,
    decodeLagGraceMs: 140,
    maxDecodeLagEvents: 3,
    useVideoFrameCallback: true,
  }
}
