import type { LandingAssetId, LandingMediaMode, LandingReadinessState } from '@/lib/landing/core/contracts'
import { resolveEffectiveMediaMode } from '@/lib/landing/media/mediaPolicy'
import { getLandingMediaAsset, resolveLandingMediaSource, resolveLandingPosterSource } from '@/lib/landing/media/mediaManifest'
import { isReadinessSatisfied, mergeReadinessState } from '@/lib/landing/media/readinessMachine'
import type { LandingSegmentConfig, LandingSceneManifest } from '@/lib/landing/scenes/sceneTypes'
import { getCriticalMediaRequests } from '@/lib/landing/media/mediaPolicy'
import type { LandingRuntimeStore } from '@/lib/landing/runtime/runtimeStore'

type LandingMediaControllerOptions = {
  manifest: LandingSceneManifest
  store: LandingRuntimeStore
}

export type LandingMediaController = {
  attachVideoElement: (element: HTMLVideoElement | null) => () => void
  setActiveSegment: (segment: LandingSegmentConfig) => void
  syncSegmentProgress: (progress: number) => void
  primeCriticalAssets: () => Promise<void>
  warmAssets: (assetIds: LandingAssetId[]) => Promise<void>
  destroy: () => void
}

export function createLandingMediaController(
  options: LandingMediaControllerOptions
): LandingMediaController {
  const { manifest, store } = options

  let videoElement: HTMLVideoElement | null = null
  let videoCleanup: (() => void) | null = null
  let activeSegment: LandingSegmentConfig | null = null
  let activeAssetId: LandingAssetId | null = null
  let activeMode: LandingMediaMode = 'poster'
  let activeSource: string | null = null

  const getDeviceProfile = () => store.getState().mediaPolicy?.deviceProfile ?? 'desktop'

  const updateReadiness = (assetId: LandingAssetId, nextState: LandingReadinessState) => {
    const current = store.getState().media.assetReadiness[assetId] ?? 'idle'
    const merged = mergeReadinessState(current, nextState)
    store.setAssetReadiness(assetId, merged)

    const state = store.getState()
    if (
      state.readiness.bootstrap !== 'ready' &&
      assetId === state.media.activeAssetId &&
      isReadinessSatisfied(merged, state.readiness.unlockTarget)
    ) {
      store.patch({
        readiness: {
          bootstrap: 'ready',
          activeAssetReadyState: merged,
        },
      })
    }
  }

  const preloadAsset = (
    assetId: LandingAssetId,
    target: 'poster-ready' | 'metadata-ready' | 'first-frame-ready' | 'playable'
  ) => {
    const deviceProfile = getDeviceProfile()
    const asset = getLandingMediaAsset(assetId)

    if (asset.kind === 'image' || target === 'poster-ready') {
      const source = resolveLandingPosterSource(assetId, deviceProfile)
      return new Promise<void>((resolve) => {
        const image = new Image()
        image.onload = () => {
          updateReadiness(assetId, 'poster-ready')
          resolve()
        }
        image.onerror = () => {
          updateReadiness(assetId, 'failed')
          resolve()
        }
        image.src = source
      })
    }

    return new Promise<void>((resolve) => {
      const preloadVideo = document.createElement('video')
      let settled = false

      const finish = (state: LandingReadinessState) => {
        if (settled) {
          return
        }

        settled = true
        updateReadiness(assetId, state)
        preloadVideo.pause()
        preloadVideo.removeAttribute('src')
        preloadVideo.load()
        preloadVideo.remove()
        resolve()
      }

      preloadVideo.muted = true
      preloadVideo.playsInline = true
      preloadVideo.preload = target === 'metadata-ready' ? 'metadata' : 'auto'
      preloadVideo.onloadedmetadata = () => {
        updateReadiness(assetId, 'metadata-ready')
        if (target === 'metadata-ready') {
          finish('metadata-ready')
        }
      }
      preloadVideo.onloadeddata = () => {
        updateReadiness(assetId, 'first-frame-ready')
        if (target === 'first-frame-ready') {
          finish('first-frame-ready')
        }
      }
      preloadVideo.oncanplay = () => finish('playable')
      preloadVideo.onerror = () => finish('failed')
      preloadVideo.src = resolveLandingMediaSource(assetId, deviceProfile)
      preloadVideo.load()
    })
  }

  const applyPlaybackMode = () => {
    if (!videoElement) {
      return
    }

    videoElement.muted = true
    videoElement.playsInline = true
    videoElement.loop = activeMode === 'loop'
    videoElement.preload = activeMode === 'scrub' ? 'auto' : 'metadata'
    videoElement.poster = activeAssetId
      ? resolveLandingPosterSource(activeAssetId, getDeviceProfile())
      : ''

    if (activeMode === 'poster') {
      videoElement.pause()
      return
    }

    if (activeMode === 'loop') {
      videoElement.play().catch(() => undefined)
      return
    }

    videoElement.pause()
  }

  const syncVideoSource = () => {
    const state = store.getState()
    const mediaPolicy = state.mediaPolicy

    if (!mediaPolicy || !activeSegment) {
      return
    }

    const effectiveMode = resolveEffectiveMediaMode(activeSegment.media.mode, mediaPolicy)
    const fallbackAssetId = activeSegment.media.posterAssetId ?? activeSegment.media.assetId ?? null
    const nextAssetId =
      effectiveMode === 'poster' ? fallbackAssetId : activeSegment.media.assetId ?? fallbackAssetId
    const nextPosterSrc = fallbackAssetId
      ? resolveLandingPosterSource(fallbackAssetId, mediaPolicy.deviceProfile)
      : null

    activeMode = effectiveMode
    activeAssetId = nextAssetId

    store.patch({
      media: {
        activeAssetId: nextAssetId,
        activePosterSrc: nextPosterSrc,
        activeMode: effectiveMode,
      },
      readiness: {
        activeAssetReadyState: nextAssetId
          ? state.media.assetReadiness[nextAssetId] ?? 'idle'
          : 'idle',
      },
    })

    if (!videoElement || !nextAssetId) {
      return
    }

    const nextSource = resolveLandingMediaSource(nextAssetId, mediaPolicy.deviceProfile)
    videoElement.poster = nextPosterSrc ?? ''

    if (effectiveMode === 'poster') {
      if (activeSource && videoElement.getAttribute('src')) {
        videoElement.pause()
      }
      return
    }

    if (activeSource !== nextSource || videoElement.getAttribute('src') !== nextSource) {
      activeSource = nextSource
      videoElement.src = nextSource
      videoElement.load()
    }

    applyPlaybackMode()
  }

  return {
    attachVideoElement(element) {
      videoCleanup?.()
      videoCleanup = null
      videoElement = element

      if (!element) {
        return () => undefined
      }

      const handleLoadedMetadata = () => {
        if (activeAssetId) {
          updateReadiness(activeAssetId, 'metadata-ready')
        }
      }

      const handleLoadedData = () => {
        if (activeAssetId) {
          updateReadiness(activeAssetId, 'first-frame-ready')
        }
        applyPlaybackMode()
      }

      const handleCanPlay = () => {
        if (activeAssetId) {
          updateReadiness(activeAssetId, 'playable')
        }
        applyPlaybackMode()
      }

      const handleError = () => {
        if (activeAssetId) {
          updateReadiness(activeAssetId, 'failed')
        }
      }

      element.addEventListener('loadedmetadata', handleLoadedMetadata)
      element.addEventListener('loadeddata', handleLoadedData)
      element.addEventListener('canplay', handleCanPlay)
      element.addEventListener('error', handleError)

      syncVideoSource()

      videoCleanup = () => {
        element.removeEventListener('loadedmetadata', handleLoadedMetadata)
        element.removeEventListener('loadeddata', handleLoadedData)
        element.removeEventListener('canplay', handleCanPlay)
        element.removeEventListener('error', handleError)
      }

      return () => {
        videoCleanup?.()
        videoCleanup = null
        if (videoElement === element) {
          videoElement = null
        }
      }
    },
    setActiveSegment(segment) {
      activeSegment = segment
      syncVideoSource()
    },
    syncSegmentProgress(progress) {
      if (!videoElement || activeMode !== 'scrub') {
        return
      }

      const duration = videoElement.duration
      if (!Number.isFinite(duration) || duration <= 0) {
        return
      }

      const nextTime = duration * Math.max(0, Math.min(1, progress))
      if (Math.abs(videoElement.currentTime - nextTime) < 0.05) {
        return
      }

      videoElement.currentTime = nextTime
    },
    async primeCriticalAssets() {
      const policy = store.getState().mediaPolicy
      if (!policy) {
        return
      }

      const requests = getCriticalMediaRequests(manifest, policy)
      if (requests.length === 0) {
        store.patch({
          readiness: {
            bootstrap: 'ready',
          },
        })
        return
      }

      await Promise.all(requests.map((request) => preloadAsset(request.assetId, request.targetReadiness)))
    },
    async warmAssets(assetIds) {
      const policy = store.getState().mediaPolicy
      if (!policy || assetIds.length === 0) {
        return
      }

      const target =
        policy.preloadStrategy === 'poster'
          ? 'poster-ready'
          : policy.preloadStrategy === 'metadata'
            ? 'metadata-ready'
            : 'first-frame-ready'

      await Promise.all(assetIds.map((assetId) => preloadAsset(assetId, target)))
    },
    destroy() {
      videoCleanup?.()
      videoCleanup = null
      if (videoElement) {
        videoElement.pause()
        videoElement.removeAttribute('src')
        videoElement.load()
      }
      videoElement = null
    },
  }
}
