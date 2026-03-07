export type LandingAssetId = 'logo' | 'samet' | 'section1' | 'section2' | 'sun' | 'hero'
export type LandingAssetKind = 'image' | 'video'
export type LandingDeviceProfile = 'desktop' | 'mobile'
export type LandingPlaybackMode = 'loop' | 'hold' | 'scrub'
export type LandingSegmentId =
  | 'section-1'
  | 'transition-1'
  | 'section-2'
  | 'transition-2'
  | 'section-3'
  | 'transition-3'
  | 'section-4'
  | 'transition-4'
  | 'section-5'
  | 'transition-5'
  | 'section-6'

export type LandingAssetDefinition = {
  id: LandingAssetId
  kind: LandingAssetKind
  label: string
  sources: Record<LandingDeviceProfile, string>
  posterSources?: Partial<Record<LandingDeviceProfile, string>>
}

export const LANDING_ASSET_DEFINITIONS: Record<LandingAssetId, LandingAssetDefinition> = {
  logo: {
    id: 'logo',
    kind: 'image',
    label: 'Логотип',
    sources: {
      desktop: '/api/preloader?asset=logo',
      mobile: '/api/preloader?asset=logo',
    },
  },
  samet: {
    id: 'samet',
    kind: 'video',
    label: 'Приветственный ролик',
    sources: {
      desktop: '/api/hero-video?asset=samet',
      mobile: '/api/hero-video?asset=samet',
    },
    posterSources: {
      desktop: '/api/hero-video?poster=1',
      mobile: '/api/hero-video?poster=1',
    },
  },
  section1: {
    id: 'section1',
    kind: 'video',
    label: 'История',
    sources: {
      desktop: '/api/hero-main-video?asset=section1&v=1080',
      mobile: '/api/hero-main-video?asset=section1&v=720',
    },
  },
  section2: {
    id: 'section2',
    kind: 'video',
    label: 'Главная информация',
    sources: {
      desktop: '/api/hero-main-video?asset=section2&v=1080',
      mobile: '/api/hero-main-video?asset=section2&v=720',
    },
  },
  sun: {
    id: 'sun',
    kind: 'video',
    label: 'Локация',
    sources: {
      desktop: '/api/hero-main-video?asset=sun&v=1080',
      mobile: '/api/hero-main-video?asset=sun&v=720',
    },
  },
  hero: {
    id: 'hero',
    kind: 'video',
    label: 'Финальный ролик',
    sources: {
      desktop: '/api/hero-main-video?asset=hero&v=1080',
      mobile: '/api/hero-main-video?asset=hero&v=720',
    },
  },
}

export const LANDING_ASSET_IDS = Object.keys(LANDING_ASSET_DEFINITIONS) as LandingAssetId[]

export function getLandingAssetDefinition(assetId: LandingAssetId) {
  return LANDING_ASSET_DEFINITIONS[assetId]
}

export function getLandingAssetSource(assetId: LandingAssetId, deviceProfile: LandingDeviceProfile) {
  return getLandingAssetDefinition(assetId).sources[deviceProfile]
}

export function getLandingPosterSource(assetId: LandingAssetId, deviceProfile: LandingDeviceProfile) {
  return getLandingAssetDefinition(assetId).posterSources?.[deviceProfile]
}
