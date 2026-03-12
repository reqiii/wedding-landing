import type { LandingSegmentConfig, LandingSceneManifest, LandingSegmentId } from '@/lib/landing/scenes/sceneTypes'

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

export function getLandingWarmupTargets(
  manifest: LandingSceneManifest,
  segmentId: LandingSegmentId | null
) {
  return getLandingSegmentById(manifest, segmentId)?.warmupHint?.targets ?? []
}

export function getLandingStoryLength(manifest: LandingSceneManifest) {
  return manifest.segments.reduce((total, segment) => total + segment.lengthVh, 0)
}
