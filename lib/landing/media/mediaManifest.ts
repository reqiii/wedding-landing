import {
  getLandingAssetDefinition,
  getLandingAssetSource,
  getLandingPosterSource,
} from '@/lib/landing/mediaManifest'
import type { LandingAssetId, LandingDeviceProfile } from '@/lib/landing/core/contracts'

export type LandingMediaAsset = ReturnType<typeof getLandingAssetDefinition>

export function getLandingMediaAsset(assetId: LandingAssetId): LandingMediaAsset {
  return getLandingAssetDefinition(assetId)
}

export function resolveLandingMediaSource(
  assetId: LandingAssetId,
  deviceProfile: LandingDeviceProfile
) {
  return getLandingAssetSource(assetId, deviceProfile)
}

export function resolveLandingPosterSource(
  assetId: LandingAssetId,
  deviceProfile: LandingDeviceProfile
) {
  return getLandingPosterSource(assetId, deviceProfile) ?? getLandingAssetSource(assetId, deviceProfile)
}
