import type { LandingWarmupHint } from '@/lib/landing/core/contracts'
import type { LandingSegmentConfig, LandingSceneManifest, LandingSegmentId } from '@/lib/landing/scenes/sceneTypes'

function isContentSegment(segment: LandingSegmentConfig) {
  return Boolean(segment.panelKey)
}

export function getLandingSegmentById(
  manifest: LandingSceneManifest,
  segmentId: LandingSegmentId | null
): LandingSegmentConfig | null {
  if (!segmentId) {
    return null
  }

  return manifest.segments.find((segment) => segment.id === segmentId) ?? null
}

export function getInitialLandingSegment(
  manifest: LandingSceneManifest
): LandingSegmentConfig {
  return manifest.segments[0]
}

export function getCriticalLandingSegments(
  manifest: LandingSceneManifest
): LandingSegmentConfig[] {
  return manifest.segments.filter((segment) => segment.preloadHint.priority === 'critical')
}

export function getVisibleLandingSegments(
  manifest: LandingSceneManifest,
  activeSegmentId: LandingSegmentId | null,
  radius = 1
): LandingSegmentConfig[] {
  const activeIndex = manifest.segments.findIndex((segment) => segment.id === activeSegmentId)
  if (activeIndex === -1) {
    return manifest.segments.slice(0, Math.min(manifest.segments.length, radius + 1))
  }

  const start = Math.max(0, activeIndex - radius)
  const end = Math.min(manifest.segments.length, activeIndex + radius + 1)
  return manifest.segments.slice(start, end)
}

export function getFirstLandingContentSegment(
  manifest: LandingSceneManifest
): LandingSegmentConfig | null {
  return manifest.segments.find(isContentSegment) ?? null
}

export function getResolvedLandingContentSegment(
  manifest: LandingSceneManifest,
  activeSegmentId: LandingSegmentId | null
): LandingSegmentConfig | null {
  const fallbackSegment = getFirstLandingContentSegment(manifest)
  if (!activeSegmentId) {
    return fallbackSegment
  }

  const activeIndex = manifest.segments.findIndex((segment) => segment.id === activeSegmentId)
  if (activeIndex === -1) {
    return fallbackSegment
  }

  // Transition segments inherit the last content segment so the panel layer
  // stays populated without changing the motion boundary contract.
  for (let index = activeIndex; index >= 0; index -= 1) {
    const segment = manifest.segments[index]
    if (isContentSegment(segment)) {
      return segment
    }
  }

  return fallbackSegment
}

export function getNextLandingContentSegment(
  manifest: LandingSceneManifest,
  segmentId: LandingSegmentId | null
): LandingSegmentConfig | null {
  if (!segmentId) {
    return getFirstLandingContentSegment(manifest)
  }

  const segmentIndex = manifest.segments.findIndex((segment) => segment.id === segmentId)
  if (segmentIndex === -1) {
    return null
  }

  for (let index = segmentIndex + 1; index < manifest.segments.length; index += 1) {
    const segment = manifest.segments[index]
    if (isContentSegment(segment)) {
      return segment
    }
  }

  return null
}

export function getMountedLandingPanelSegments(
  manifest: LandingSceneManifest,
  activeSegmentId: LandingSegmentId | null,
  includeUpcoming = true
): LandingSegmentConfig[] {
  const primarySegment = getResolvedLandingContentSegment(manifest, activeSegmentId)
  if (!primarySegment) {
    return []
  }

  if (!includeUpcoming) {
    return [primarySegment]
  }

  const upcomingSegment = getNextLandingContentSegment(manifest, primarySegment.id)
  return upcomingSegment ? [primarySegment, upcomingSegment] : [primarySegment]
}

export function getLandingWarmupTargets(
  manifest: LandingSceneManifest,
  segmentId: LandingSegmentId | null,
  when?: LandingWarmupHint['when']
) {
  const warmupHint = getLandingSegmentById(manifest, segmentId)?.warmupHint
  if (!warmupHint) {
    return []
  }

  if (when && warmupHint.when !== when) {
    return []
  }

  return warmupHint.targets
}

export function getLandingStoryLength(manifest: LandingSceneManifest) {
  return manifest.segments.reduce((total, segment) => total + segment.lengthVh, 0)
}
