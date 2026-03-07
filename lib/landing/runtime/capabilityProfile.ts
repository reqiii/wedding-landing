export type LandingCapabilityProfile =
  | 'highDesktop'
  | 'highMobile'
  | 'midRange'
  | 'lowEnd'

export type LandingMediaProfile = 'desktop' | 'mobile'

export type LandingCapabilitySnapshot = {
  profile: LandingCapabilityProfile
  mediaProfile: LandingMediaProfile
  prefersReducedMotion: boolean
  isMobileSafari: boolean
  saveData: boolean
  effectiveType: string | null
  hardwareConcurrency: number | null
  deviceMemory: number | null
  webglRenderer: string | null
  fpsEstimate: number | null
  decodeScore: number | null
}

export type LandingRuntimePolicy = {
  profile: LandingCapabilityProfile
  mediaProfile: LandingMediaProfile
  prefersReducedMotion: boolean
  isMobileSafari: boolean
  allowVideoScrub: boolean
  allowDualVideoLayers: boolean
  allowVideoBlurTransitions: boolean
  allowGlassDisplacement: boolean
  allowBackdropBlur: boolean
  allowAmbientPreloader: boolean
  preferPosters: boolean
  simplifiedIndicators: boolean
  preloadConcurrency: number
  preloadStrategy: 'poster' | 'metadata'
  telemetryDowngradeEnabled: boolean
}

type NavigatorWithHints = Navigator & {
  connection?: {
    effectiveType?: string
    saveData?: boolean
  }
  deviceMemory?: number
  maxTouchPoints?: number
}

const LOW_END_FPS = 42
const MID_RANGE_FPS = 52

const isMobileViewport = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 900px)').matches
}

const isMobileUserAgent = (ua: string) =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)

const isMobileSafariUserAgent = (ua: string) => {
  const isIOS = /iP(ad|hone|od)/.test(ua)
  const isWebkit = /WebKit/.test(ua)
  const isCriOS = /CriOS/.test(ua)
  const isFxiOS = /FxiOS/.test(ua)
  return isIOS && isWebkit && !isCriOS && !isFxiOS
}

export function getWebGlRenderer(): string | null {
  if (typeof document === 'undefined') return null

  const canvas = document.createElement('canvas')
  const gl = (
    canvas.getContext('webgl', { powerPreference: 'high-performance' }) ||
    canvas.getContext('experimental-webgl')
  ) as WebGLRenderingContext | null
  if (!gl) return null

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  if (!debugInfo) return null

  return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string
}

export async function probeFrameRate(sampleMs = 350): Promise<number | null> {
  if (typeof window === 'undefined') return null

  return new Promise((resolve) => {
    const start = performance.now()
    let frames = 0

    const tick = (now: number) => {
      frames += 1
      if (now - start >= sampleMs) {
        resolve((frames * 1000) / (now - start))
        return
      }
      window.requestAnimationFrame(tick)
    }

    window.requestAnimationFrame(tick)
  })
}

export async function probeVideoDecodeScore(src?: string | null): Promise<number | null> {
  if (typeof document === 'undefined' || !src) return null

  return new Promise((resolve) => {
    const video = document.createElement('video')
    let settled = false
    const start = performance.now()

    const finish = (value: number | null) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      video.pause()
      video.removeAttribute('src')
      video.load()
      video.removeEventListener('loadeddata', handleReady)
      video.removeEventListener('error', handleError)
      resolve(value)
    }

    const handleReady = () => {
      const elapsed = performance.now() - start
      // Lower is better; normalize into a 0-100 score.
      finish(Math.max(0, Math.min(100, 100 - elapsed / 20)))
    }

    const handleError = () => finish(null)
    const timeoutId = window.setTimeout(() => finish(null), 4000)

    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.addEventListener('loadeddata', handleReady)
    video.addEventListener('error', handleError)
    video.src = src
    video.load()
  })
}

export function detectLandingCapabilities(input: {
  fpsEstimate?: number | null
  decodeScore?: number | null
  renderer?: string | null
} = {}): LandingCapabilitySnapshot {
  const navigatorRef = typeof navigator === 'undefined' ? null : (navigator as NavigatorWithHints)
  const ua = navigatorRef?.userAgent ?? ''
  const mobileViewport = isMobileViewport()
  const mobileUserAgent = isMobileUserAgent(ua)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobileSafari = isMobileSafariUserAgent(ua)
  const effectiveType = navigatorRef?.connection?.effectiveType ?? null
  const saveData = Boolean(navigatorRef?.connection?.saveData)
  const hardwareConcurrency = navigatorRef?.hardwareConcurrency ?? null
  const deviceMemory = navigatorRef?.deviceMemory ?? null
  const maxTouchPoints = navigatorRef?.maxTouchPoints ?? 0
  const fpsEstimate = input.fpsEstimate ?? null
  const decodeScore = input.decodeScore ?? null
  const renderer = input.renderer ?? null
  const mediaProfile: LandingMediaProfile = mobileViewport ? 'mobile' : 'desktop'

  if (prefersReducedMotion || saveData || effectiveType === '2g' || effectiveType === 'slow-2g') {
    return {
      profile: 'lowEnd',
      mediaProfile,
      prefersReducedMotion,
      isMobileSafari,
      saveData,
      effectiveType,
      hardwareConcurrency,
      deviceMemory,
      webglRenderer: renderer,
      fpsEstimate,
      decodeScore,
    }
  }

  let score = 0
  let hostPerformanceScore = 0

  if (!mobileUserAgent && maxTouchPoints === 0) score += 2
  if ((hardwareConcurrency ?? 0) >= 8) {
    score += 2
    hostPerformanceScore += 2
  } else if ((hardwareConcurrency ?? 0) >= 6) {
    score += 1
    hostPerformanceScore += 1
  }

  if ((deviceMemory ?? 0) >= 8) {
    score += 2
    hostPerformanceScore += 2
  } else if ((deviceMemory ?? 0) >= 4) {
    score += 1
    hostPerformanceScore += 1
  }

  if (effectiveType === '4g' || effectiveType === null) score += 1
  if ((fpsEstimate ?? 60) >= 58) {
    score += 2
    hostPerformanceScore += 2
  } else if ((fpsEstimate ?? 60) >= MID_RANGE_FPS) {
    score += 1
    hostPerformanceScore += 1
  }

  if ((decodeScore ?? 60) >= 80) {
    score += 2
    hostPerformanceScore += 2
  } else if ((decodeScore ?? 60) >= 55) {
    score += 1
    hostPerformanceScore += 1
  }

  if (renderer && /apple|adreno|nvidia|radeon|iris|mali-g7/i.test(renderer)) {
    score += 1
    hostPerformanceScore += 1
  }

  if ((fpsEstimate ?? 60) <= LOW_END_FPS) {
    score -= 2
  }

  let profile: LandingCapabilityProfile
  if (score >= 8) {
    profile = mediaProfile === 'mobile' ? 'highMobile' : 'highDesktop'
  } else if (score >= 5) {
    profile = 'midRange'
  } else {
    profile = 'lowEnd'
  }

  const desktopHostedMobile =
    mediaProfile === 'mobile' &&
    !isMobileSafari &&
    hostPerformanceScore >= 6 &&
    (hardwareConcurrency ?? 0) >= 8 &&
    (fpsEstimate ?? 0) >= 48 &&
    (decodeScore ?? 0) >= 70

  if (desktopHostedMobile) {
    profile = 'highMobile'
  }

  if (isMobileSafari && profile === 'highDesktop') {
    profile = 'highMobile'
  }

  return {
    profile,
    mediaProfile,
    prefersReducedMotion,
    isMobileSafari,
    saveData,
    effectiveType,
    hardwareConcurrency,
    deviceMemory,
    webglRenderer: renderer,
    fpsEstimate,
    decodeScore,
  }
}

export function createLandingRuntimePolicy(
  snapshot: LandingCapabilitySnapshot
): LandingRuntimePolicy {
  if (snapshot.prefersReducedMotion || snapshot.profile === 'lowEnd') {
    return {
      profile: 'lowEnd',
      mediaProfile: snapshot.mediaProfile,
      prefersReducedMotion: snapshot.prefersReducedMotion,
      isMobileSafari: snapshot.isMobileSafari,
      allowVideoScrub: false,
      allowDualVideoLayers: false,
      allowVideoBlurTransitions: false,
      allowGlassDisplacement: false,
      allowBackdropBlur: false,
      allowAmbientPreloader: false,
      preferPosters: true,
      simplifiedIndicators: true,
      preloadConcurrency: 1,
      preloadStrategy: 'poster',
      telemetryDowngradeEnabled: false,
    }
  }

  if (snapshot.profile === 'midRange') {
    const allowDesktopScrub = snapshot.mediaProfile === 'desktop' && !snapshot.isMobileSafari

    return {
      profile: 'midRange',
      mediaProfile: snapshot.mediaProfile,
      prefersReducedMotion: snapshot.prefersReducedMotion,
      isMobileSafari: snapshot.isMobileSafari,
      allowVideoScrub: allowDesktopScrub,
      allowDualVideoLayers: false,
      allowVideoBlurTransitions: false,
      allowGlassDisplacement: false,
      allowBackdropBlur: true,
      allowAmbientPreloader: false,
      preferPosters: false,
      simplifiedIndicators: false,
      preloadConcurrency: 1,
      preloadStrategy: 'metadata',
      telemetryDowngradeEnabled: true,
    }
  }

  if (snapshot.profile === 'highMobile') {
    return {
      profile: 'highMobile',
      mediaProfile: snapshot.mediaProfile,
      prefersReducedMotion: snapshot.prefersReducedMotion,
      isMobileSafari: snapshot.isMobileSafari,
      allowVideoScrub: !snapshot.isMobileSafari,
      allowDualVideoLayers: false,
      allowVideoBlurTransitions: false,
      allowGlassDisplacement: false,
      allowBackdropBlur: true,
      allowAmbientPreloader: true,
      preferPosters: false,
      simplifiedIndicators: false,
      preloadConcurrency: 2,
      preloadStrategy: 'metadata',
      telemetryDowngradeEnabled: true,
    }
  }

  return {
    profile: 'highDesktop',
    mediaProfile: snapshot.mediaProfile,
    prefersReducedMotion: snapshot.prefersReducedMotion,
    isMobileSafari: snapshot.isMobileSafari,
    allowVideoScrub: true,
    allowDualVideoLayers: true,
    allowVideoBlurTransitions: false,
    allowGlassDisplacement: true,
    allowBackdropBlur: true,
    allowAmbientPreloader: true,
    preferPosters: false,
    simplifiedIndicators: false,
    preloadConcurrency: 2,
    preloadStrategy: 'metadata',
    telemetryDowngradeEnabled: true,
  }
}
