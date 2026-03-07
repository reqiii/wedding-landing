import {
  getLandingAssetDefinition,
  getLandingAssetSource,
  getLandingPosterSource,
  type LandingAssetDefinition,
  type LandingAssetId,
  type LandingAssetKind,
  type LandingDeviceProfile,
} from '@/lib/landing/mediaManifest'

export type LandingAssetLoadStatus = 'idle' | 'loading' | 'ready' | 'failed'
export type LandingAssetLoadStrategy = 'strict' | 'strict-native' | 'background'
export type LandingAssetFailureReason = 'timeout' | 'error'

export type LandingAssetState = {
  id: LandingAssetId
  kind: LandingAssetKind
  label: string
  src: string
  posterSrc?: string
  status: LandingAssetLoadStatus
  strategy?: LandingAssetLoadStrategy
  resolvedSrc?: string
  failureReason?: LandingAssetFailureReason
}

export type LandingAssetStateMap = Record<LandingAssetId, LandingAssetState>

export type LandingAssetLoadResult = {
  status: Exclude<LandingAssetLoadStatus, 'idle' | 'loading'>
  resolvedSrc?: string
  failureReason?: LandingAssetFailureReason
}

export const IMAGE_TIMEOUT_MS = 15000
export const VIDEO_TIMEOUT_MS = 45000

export function createLandingAssetStateMap(
  deviceProfile: LandingDeviceProfile
): LandingAssetStateMap {
  return {
    logo: createAssetState('logo', deviceProfile),
    samet: createAssetState('samet', deviceProfile),
    section1: createAssetState('section1', deviceProfile),
    section2: createAssetState('section2', deviceProfile),
    sun: createAssetState('sun', deviceProfile),
    hero: createAssetState('hero', deviceProfile),
  }
}

function createAssetState(
  assetId: LandingAssetId,
  deviceProfile: LandingDeviceProfile
): LandingAssetState {
  const definition = getLandingAssetDefinition(assetId)
  return {
    id: definition.id,
    kind: definition.kind,
    label: definition.label,
    src: getLandingAssetSource(assetId, deviceProfile),
    posterSrc: getLandingPosterSource(assetId, deviceProfile),
    status: 'idle',
  }
}

function preloadImage(definition: LandingAssetDefinition, src: string): Promise<LandingAssetLoadResult> {
  return new Promise((resolve) => {
    const image = new window.Image()
    let settled = false

    const finish = (result: LandingAssetLoadResult) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      image.onload = null
      image.onerror = null
      resolve(result)
    }

    const timeoutId = window.setTimeout(
      () => finish({ status: 'failed', failureReason: 'timeout' }),
      IMAGE_TIMEOUT_MS
    )

    image.onload = () => finish({ status: 'ready' })
    image.onerror = () => finish({ status: 'failed', failureReason: 'error' })
    image.decoding = 'async'
    image.src = src

    if (image.complete) {
      finish({ status: 'ready' })
    }
  })
}

function preloadVideoBackground(src: string): Promise<LandingAssetLoadResult> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    let settled = false

    const finish = (result: LandingAssetLoadResult) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      video.removeEventListener('loadeddata', handleReady)
      video.removeEventListener('canplaythrough', handleReady)
      video.removeEventListener('error', handleError)
      video.pause()
      video.removeAttribute('src')
      video.load()
      resolve(result)
    }

    const handleReady = () => finish({ status: 'ready' })
    const handleError = () => finish({ status: 'failed', failureReason: 'error' })
    const timeoutId = window.setTimeout(
      () => finish({ status: 'failed', failureReason: 'timeout' }),
      VIDEO_TIMEOUT_MS
    )

    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.addEventListener('loadeddata', handleReady)
    video.addEventListener('canplaythrough', handleReady)
    video.addEventListener('error', handleError)
    video.src = src
    video.load()

    if (video.readyState >= 2) {
      finish({ status: 'ready' })
    }
  })
}

async function preloadVideoStrict(src: string): Promise<LandingAssetLoadResult> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), VIDEO_TIMEOUT_MS)

  try {
    const response = await fetch(src, {
      signal: controller.signal,
      cache: 'force-cache',
    })

    if (!response.ok) {
      return { status: 'failed', failureReason: 'error' }
    }

    const blob = await response.blob()
    return {
      status: 'ready',
      resolvedSrc: URL.createObjectURL(blob),
    }
  } catch (error) {
    return {
      status: 'failed',
      failureReason: error instanceof DOMException && error.name === 'AbortError' ? 'timeout' : 'error',
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function preloadVideoStrictNative(src: string): Promise<LandingAssetLoadResult> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    let settled = false

    const finish = (result: LandingAssetLoadResult) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      video.removeEventListener('loadeddata', handleReady)
      video.removeEventListener('canplaythrough', handleReady)
      video.removeEventListener('error', handleError)
      video.pause()
      video.removeAttribute('src')
      video.load()
      resolve(result)
    }

    const handleReady = () => finish({ status: 'ready' })
    const handleError = () => finish({ status: 'failed', failureReason: 'error' })
    const timeoutId = window.setTimeout(
      () => finish({ status: 'failed', failureReason: 'timeout' }),
      VIDEO_TIMEOUT_MS
    )

    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.addEventListener('loadeddata', handleReady)
    video.addEventListener('canplaythrough', handleReady)
    video.addEventListener('error', handleError)
    video.src = src
    video.load()

    if (video.readyState >= 2) {
      finish({ status: 'ready' })
    }
  })
}

export async function loadLandingAsset(
  assetId: LandingAssetId,
  deviceProfile: LandingDeviceProfile,
  strategy: LandingAssetLoadStrategy
): Promise<LandingAssetLoadResult> {
  const definition = getLandingAssetDefinition(assetId)
  const src = getLandingAssetSource(assetId, deviceProfile)

  if (definition.kind === 'image') {
    return preloadImage(definition, src)
  }

  if (strategy === 'strict') {
    return preloadVideoStrict(src)
  }

  if (strategy === 'strict-native') {
    return preloadVideoStrictNative(src)
  }

  return preloadVideoBackground(src)
}
