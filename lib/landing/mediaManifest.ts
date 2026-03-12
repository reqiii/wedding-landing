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

const LANDING_MEDIA_BASE_PATH =
  process.env.NEXT_PUBLIC_LANDING_MEDIA_BASE_PATH?.replace(/\/$/, '') || '/landing-media'

const withMediaBase = (path: string) => `${LANDING_MEDIA_BASE_PATH}${path}`

export const LANDING_ASSET_DEFINITIONS: Record<LandingAssetId, LandingAssetDefinition> = {
  logo: {
    id: 'logo',
    kind: 'image',
    label: 'Логотип',
    sources: {
      desktop: withMediaBase('/logo/logo.svg'),
      mobile: withMediaBase('/logo/logo.svg'),
    },
  },
  samet: {
    id: 'samet',
    kind: 'video',
    label: 'Приветственный ролик',
    sources: {
      desktop: withMediaBase('/videos/samet.mp4'),
      mobile: withMediaBase('/videos/samet.mp4'),
    },
    posterSources: {
      desktop: withMediaBase('/posters/samet.jpg'),
      mobile: withMediaBase('/posters/samet.jpg'),
    },
  },
  section1: {
    id: 'section1',
    kind: 'video',
    label: 'История',
    sources: {
      desktop: withMediaBase('/videos/section1-1080.mp4'),
      mobile: withMediaBase('/videos/section1-720.mp4'),
    },
    posterSources: {
      desktop: withMediaBase('/posters/section1.jpg'),
      mobile: withMediaBase('/posters/section1.jpg'),
    },
  },
  section2: {
    id: 'section2',
    kind: 'video',
    label: 'Главная информация',
    sources: {
      desktop: withMediaBase('/videos/section2-1080.mp4'),
      mobile: withMediaBase('/videos/section2-720.mp4'),
    },
    posterSources: {
      desktop: withMediaBase('/posters/section2.jpg'),
      mobile: withMediaBase('/posters/section2.jpg'),
    },
  },
  sun: {
    id: 'sun',
    kind: 'video',
    label: 'Локация',
    sources: {
      desktop: withMediaBase('/videos/sun-1080.mp4'),
      mobile: withMediaBase('/videos/sun-720.mp4'),
    },
    posterSources: {
      desktop: withMediaBase('/posters/sun.jpg'),
      mobile: withMediaBase('/posters/sun.jpg'),
    },
  },
  hero: {
    id: 'hero',
    kind: 'video',
    label: 'Финальный ролик',
    sources: {
      desktop: withMediaBase('/videos/hero-1080.mp4'),
      mobile: withMediaBase('/videos/hero-720.mp4'),
    },
    posterSources: {
      desktop: withMediaBase('/posters/hero.jpg'),
      mobile: withMediaBase('/posters/hero.jpg'),
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

export function resolveLandingMediaSource(assetId: LandingAssetId, deviceProfile: LandingDeviceProfile) {
  return getLandingAssetSource(assetId, deviceProfile)
}

export function resolveLandingPosterSource(assetId: LandingAssetId, deviceProfile: LandingDeviceProfile) {
  return getLandingPosterSource(assetId, deviceProfile) ?? getLandingAssetSource(assetId, deviceProfile)
}
