import {
  getLandingAssetDefinition,
  getLandingAssetSource,
  getLandingPosterSource,
  type LandingAssetDefinition,
} from '@/lib/landing/mediaManifest'
import {
  getBackgroundImmediateLandingAssetIds,
  getCriticalLandingAssetIds,
} from '@/lib/landing/preloadPolicy'

export type LandingPreloadAsset = {
  id: string
  kind: 'image' | 'video'
  src: string
  label: string
}

export { getLandingAssetDefinition, getLandingPosterSource, type LandingAssetDefinition }

export function getLandingVideoSource(assetId: Parameters<typeof getLandingAssetSource>[0], isMobile: boolean) {
  return getLandingAssetSource(assetId, isMobile ? 'mobile' : 'desktop')
}

export function getCriticalLandingPreloadAssets() {
  return getCriticalLandingAssetIds()
}

export function getBackgroundLandingPreloadAssets() {
  return getBackgroundImmediateLandingAssetIds()
}
