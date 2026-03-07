export type ResponsiveLandingVideoAsset = 'section1' | 'section2' | 'sun' | 'hero'
export type LandingVideoAsset = 'samet' | ResponsiveLandingVideoAsset

export type LandingPreloadAsset = {
  id: string
  kind: 'image' | 'video'
  src: string
  label: string
}

const RESPONSIVE_VIDEO_SOURCES: Record<
  ResponsiveLandingVideoAsset,
  { desktop: string; mobile: string }
> = {
  section1: {
    desktop: '/api/hero-main-video?asset=section1&v=1080',
    mobile: '/api/hero-main-video?asset=section1&v=720',
  },
  section2: {
    desktop: '/api/hero-main-video?asset=section2&v=1080',
    mobile: '/api/hero-main-video?asset=section2&v=720',
  },
  sun: {
    desktop: '/api/hero-main-video?asset=sun&v=1080',
    mobile: '/api/hero-main-video?asset=sun&v=720',
  },
  hero: {
    desktop: '/api/hero-main-video?asset=hero&v=1080',
    mobile: '/api/hero-main-video?asset=hero&v=720',
  },
}

const STATIC_VIDEO_SOURCES: Record<'samet', string> = {
  samet: '/api/hero-video?asset=samet',
}

export const LANDING_LOGO_SRC = '/api/preloader?asset=logo'

export function getLandingResponsiveVideoSources(asset: ResponsiveLandingVideoAsset) {
  return RESPONSIVE_VIDEO_SOURCES[asset]
}

export function getLandingVideoSource(asset: LandingVideoAsset, isMobile: boolean) {
  if (asset in STATIC_VIDEO_SOURCES) {
    return STATIC_VIDEO_SOURCES[asset as keyof typeof STATIC_VIDEO_SOURCES]
  }

  const responsiveAsset = asset as ResponsiveLandingVideoAsset
  return isMobile
    ? RESPONSIVE_VIDEO_SOURCES[responsiveAsset].mobile
    : RESPONSIVE_VIDEO_SOURCES[responsiveAsset].desktop
}

export function getLandingPreloadAssets(isMobile: boolean): LandingPreloadAsset[] {
  return [
    {
      id: 'logo',
      kind: 'image',
      src: LANDING_LOGO_SRC,
      label: 'Логотип',
    },
    {
      id: 'samet',
      kind: 'video',
      src: getLandingVideoSource('samet', isMobile),
      label: 'Приветственный ролик',
    },
    {
      id: 'section1',
      kind: 'video',
      src: getLandingVideoSource('section1', isMobile),
      label: 'История',
    },
    {
      id: 'section2',
      kind: 'video',
      src: getLandingVideoSource('section2', isMobile),
      label: 'Главная информация',
    },
    {
      id: 'sun',
      kind: 'video',
      src: getLandingVideoSource('sun', isMobile),
      label: 'Локация',
    },
    {
      id: 'hero',
      kind: 'video',
      src: getLandingVideoSource('hero', isMobile),
      label: 'Финальный ролик',
    },
  ]
}
