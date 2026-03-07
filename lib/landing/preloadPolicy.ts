import type { LandingAssetId, LandingSegmentId } from '@/lib/landing/mediaManifest'

export const CRITICAL_LANDING_ASSET_IDS: LandingAssetId[] = ['logo', 'samet', 'section1']
export const BACKGROUND_IMMEDIATE_LANDING_ASSET_IDS: LandingAssetId[] = ['section2']

const WARM_ON_SEGMENT: Partial<Record<LandingSegmentId, LandingAssetId[]>> = {
  'section-1': ['section2'],
  'transition-1': ['section2'],
  'section-2': ['sun'],
  'transition-2': ['sun'],
  'section-3': ['hero'],
  'transition-3': ['hero'],
  'section-4': ['hero'],
  'transition-4': ['hero'],
  'section-5': ['hero'],
}

export function getCriticalLandingAssetIds() {
  return CRITICAL_LANDING_ASSET_IDS
}

export function getBackgroundImmediateLandingAssetIds() {
  return BACKGROUND_IMMEDIATE_LANDING_ASSET_IDS
}

export function getWarmupAssetIdsForSegment(segmentId: LandingSegmentId) {
  return WARM_ON_SEGMENT[segmentId] ?? []
}
