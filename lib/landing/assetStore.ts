import {
  getLandingAssetDefinition,
  getLandingAssetSource,
  getLandingPosterSource,
  type LandingAssetId,
  type LandingAssetKind,
  type LandingDeviceProfile,
} from '@/lib/landing/mediaManifest'

export type LandingAssetLoadStatus = 'idle' | 'loading' | 'ready' | 'failed'
export type LandingAssetLoadStrategy = 'critical' | 'metadata' | 'background'
export type LandingAssetFailureReason = 'timeout' | 'error'

export type LandingAssetState = {
  id: LandingAssetId
  kind: LandingAssetKind
  label: string
  src: string
  posterSrc?: string
  status: LandingAssetLoadStatus
  strategy?: LandingAssetLoadStrategy
  failureReason?: LandingAssetFailureReason
}

export type LandingAssetStateMap = Record<LandingAssetId, LandingAssetState>

export type LandingAssetLoadResult = {
  status: Exclude<LandingAssetLoadStatus, 'idle' | 'loading'>
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

function preloadImage(src: string): Promise<LandingAssetLoadResult> {
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

function preloadVideo(src: string, readiness: 'metadata' | 'data'): Promise<LandingAssetLoadResult> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    let settled = false

    const finish = (result: LandingAssetLoadResult) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      video.removeEventListener(readiness === 'metadata' ? 'loadedmetadata' : 'loadeddata', handleReady)
      video.removeEventListener('canplay', handleReady)
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

    video.preload = readiness === 'metadata' ? 'metadata' : 'auto'
    video.muted = true
    video.playsInline = true
    video.addEventListener(readiness === 'metadata' ? 'loadedmetadata' : 'loadeddata', handleReady)
    video.addEventListener('canplay', handleReady)
    video.addEventListener('error', handleError)
    video.src = src
    video.load()

    if (video.readyState >= (readiness === 'metadata' ? 1 : 2)) {
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
  const posterSrc = getLandingPosterSource(assetId, deviceProfile)

  if (definition.kind === 'image') {
    return preloadImage(src)
  }

  if (strategy === 'critical' && posterSrc) {
    return preloadImage(posterSrc)
  }

  if (strategy === 'critical') {
    return preloadVideo(src, 'metadata')
  }

  if (strategy === 'metadata') {
    return preloadVideo(src, 'metadata')
  }

  return preloadVideo(src, 'data')
}
