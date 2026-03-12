import type { LandingAssetId, LandingMediaMode, LandingReadinessState, LandingReadyTarget } from '@/lib/landing/core/contracts'
import {
  createLandingAssetRegistry,
  type LandingResolvedAsset,
  type LandingResolvedSegmentMedia,
} from '@/lib/landing/media/assetRegistry'
import {
  type LandingMediaPreloadRequest,
  getScrubSettings,
  getWarmupTargetReadiness,
  shouldUseStandbyPlane,
} from '@/lib/landing/media/mediaPolicy'
import { createLandingMediaPool, type LandingMediaPlane } from '@/lib/landing/media/mediaPool'
import {
  isReadinessSatisfied,
  mergeReadinessState,
} from '@/lib/landing/media/readinessMachine'
import type { LandingSceneId, LandingSegmentConfig, LandingSceneManifest } from '@/lib/landing/scenes/sceneTypes'
import type { LandingRuntimeStore } from '@/lib/landing/runtime/runtimeStore'
import type { LandingMediaPolicy } from '@/lib/landing/tier/tierTypes'

type LandingMediaControllerOptions = {
  manifest: LandingSceneManifest
  store: LandingRuntimeStore
}

export type LandingMediaController = {
  attachMediaHost: (element: HTMLElement | null) => () => void
  activateScene: (sceneId: LandingSceneId | null) => void
  setActiveSegment: (segment: LandingSegmentConfig) => void
  syncSegmentProgress: (sceneId: LandingSceneId, progress: number) => void
  preloadRequests: (requests: LandingMediaPreloadRequest[]) => Promise<void>
  warmAssets: (assetIds: LandingAssetId[]) => Promise<void>
  fallbackToPoster: () => void
  destroy: () => void
}

export function createLandingMediaController(
  options: LandingMediaControllerOptions
): LandingMediaController {
  const { manifest, store } = options
  const assetRegistry = createLandingAssetRegistry(manifest)
  const mediaPool = createLandingMediaPool({
    onPlaneCreated: (plane) => {
      attachPlaneListeners(plane)
    },
  })

  let mediaHostCleanup: (() => void) | null = null
  let activeSceneId: LandingSceneId | null = null
  let activeSegment: LandingSegmentConfig | null = null
  let activeResolvedSegment: LandingResolvedSegmentMedia | null = null
  let activeRuntimeMode: LandingMediaMode = 'poster'
  let activeModeOverride: LandingMediaMode | null = null
  let pendingScrubProgress: number | null = null
  let lastAppliedProgress = Number.NaN
  let lastSeekAt = 0
  let scrubFlushTimer = 0
  let decodeLagTimer = 0
  let awaitingVideoFrame = false
  let decodeLagEvents = 0

  type PreloadJob = {
    targetReadiness: LandingReadyTarget
    promise: Promise<void>
  }

  const preloadJobs = new Map<LandingAssetId, PreloadJob>()

  const updateReadiness = (assetId: LandingAssetId, nextState: LandingReadinessState) => {
    const current = store.getState().media.assetReadiness[assetId] ?? 'idle'
    const merged = mergeReadinessState(current, nextState)
    store.setAssetReadiness(assetId, merged)

    if (
      activeResolvedSegment &&
      assetId === activeResolvedSegment.activeAsset?.assetId &&
      activeRuntimeMode !== 'poster' &&
      merged === 'failed'
    ) {
      fallbackActiveMode('poster')
    }
  }

  const getMediaPolicy = () => store.getState().mediaPolicy

  const getActivePlane = () => mediaPool.getPlaneByRole('active')

  const preloadAsset = async (
    assetId: LandingAssetId,
    target: LandingReadyTarget,
    policy: LandingMediaPolicy
  ) => {
    const asset = assetRegistry.getAsset(assetId, policy)

    if (asset.kind === 'image' || target === 'poster-ready') {
      await new Promise<void>((resolve) => {
        const image = new Image()
        image.onload = () => {
          updateReadiness(assetId, 'poster-ready')
          resolve()
        }
        image.onerror = () => {
          updateReadiness(assetId, 'failed')
          resolve()
        }
        image.src = asset.posterSrc
      })

      return
    }

    await new Promise<void>((resolve) => {
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
      preloadVideo.poster = asset.posterSrc
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
      preloadVideo.src = asset.src
      preloadVideo.load()
    })
  }

  const queueScrubFlush = (delayMs = 0) => {
    if (typeof window === 'undefined') {
      return
    }

    if (scrubFlushTimer) {
      window.clearTimeout(scrubFlushTimer)
    }

    scrubFlushTimer = window.setTimeout(() => {
      scrubFlushTimer = 0
      flushPendingScrub(false)
    }, delayMs)
  }

  const clearScrubState = () => {
    pendingScrubProgress = null
    lastAppliedProgress = Number.NaN
    awaitingVideoFrame = false
    decodeLagEvents = 0

    if (typeof window !== 'undefined') {
      if (scrubFlushTimer) {
        window.clearTimeout(scrubFlushTimer)
        scrubFlushTimer = 0
      }
      if (decodeLagTimer) {
        window.clearTimeout(decodeLagTimer)
        decodeLagTimer = 0
      }
    }
  }

  const updateRuntimeSnapshot = (mode: LandingMediaMode) => {
    const state = store.getState()
    const activeAsset = activeResolvedSegment?.activeAsset ?? null
    const posterAsset = activeResolvedSegment?.posterAsset ?? activeAsset

    store.patch({
      media: {
        activeAssetId: activeAsset?.assetId ?? null,
        activePosterSrc: posterAsset?.posterSrc ?? null,
        activeMode: mode,
      },
      readiness: {
        activeAssetReadyState: activeAsset
          ? state.media.assetReadiness[activeAsset.assetId] ?? 'idle'
          : 'idle',
      },
    })
  }

  const syncPlaneSource = (
    plane: LandingMediaPlane,
    asset: LandingResolvedAsset,
    mode: LandingMediaMode
  ) => {
    const element = plane.element
    if (element.getAttribute('src') !== asset.src) {
      element.src = asset.src
      element.load()
    }

    element.poster = asset.posterSrc
    element.loop = mode === 'loop'
    element.preload = mode === 'scrub' ? 'auto' : 'metadata'
    element.muted = true
    element.playsInline = true
  }

  const fallbackActiveMode = (mode: Extract<LandingMediaMode, 'hold' | 'poster'>) => {
    if (!activeResolvedSegment) {
      return
    }

    if (activeRuntimeMode === mode) {
      return
    }

    activeModeOverride = mode
    activeRuntimeMode = mode
    clearScrubState()
    store.patch({
      readiness: {
        fallbackMode: mode === 'poster' ? 'poster' : store.getState().readiness.fallbackMode,
      },
    })
    updateRuntimeSnapshot(mode)
    applyActiveSegment()
  }

  const applyPlaybackMode = () => {
    const activePlane = getActivePlane()
    if (!activePlane) {
      return
    }

    const element = activePlane.element
    element.loop = activeRuntimeMode === 'loop'

    if (activeRuntimeMode === 'poster') {
      element.pause()
      mediaPool.releaseRole('active')
      return
    }

    if (activeRuntimeMode === 'loop') {
      const playPromise = element.play()
      if (playPromise) {
        void playPromise.catch(() => {
          fallbackActiveMode('hold')
        })
      }
      return
    }

    element.pause()
    if (activeRuntimeMode === 'hold' && Number.isFinite(element.duration) && element.duration > 0) {
      if (element.currentTime <= 0.001) {
        try {
          element.currentTime = Math.min(element.duration, 0.04)
        } catch {
          fallbackActiveMode('poster')
        }
      }
      return
    }

    if (activeRuntimeMode === 'scrub' && pendingScrubProgress !== null) {
      flushPendingScrub(true)
    }
  }

  const flushPendingScrub = (force: boolean) => {
    const policy = getMediaPolicy()
    const activePlane = getActivePlane()
    if (!policy || !activePlane || activeRuntimeMode !== 'scrub') {
      return
    }

    const settings = getScrubSettings(policy)
    if (!settings.enabled || pendingScrubProgress === null) {
      return
    }

    const element = activePlane.element
    const duration = element.duration
    if (!Number.isFinite(duration) || duration <= 0) {
      return
    }

    const now = performance.now()
    if (!force) {
      const waitMs = settings.minSeekIntervalMs - (now - lastSeekAt)
      if (waitMs > 0) {
        queueScrubFlush(waitMs)
        return
      }

      if (awaitingVideoFrame && settings.useVideoFrameCallback) {
        return
      }
    }

    const nextProgress = pendingScrubProgress
    const nextTime = duration * Math.max(0, Math.min(1, nextProgress))
    if (
      !Number.isNaN(lastAppliedProgress) &&
      Math.abs(lastAppliedProgress - nextProgress) <= settings.progressEpsilon
    ) {
      pendingScrubProgress = null
      return
    }

    if (Math.abs(element.currentTime - nextTime) <= settings.timeEpsilonSeconds) {
      lastAppliedProgress = nextProgress
      pendingScrubProgress = null
      return
    }

    try {
      element.currentTime = nextTime
    } catch {
      fallbackActiveMode('hold')
      return
    }

    lastSeekAt = now
    lastAppliedProgress = nextProgress
    pendingScrubProgress = null

    if (
      settings.useVideoFrameCallback &&
      typeof element.requestVideoFrameCallback === 'function'
    ) {
      awaitingVideoFrame = true
      element.requestVideoFrameCallback(() => {
        awaitingVideoFrame = false
        decodeLagEvents = 0
        if (decodeLagTimer) {
          window.clearTimeout(decodeLagTimer)
          decodeLagTimer = 0
        }
        if (pendingScrubProgress !== null) {
          queueScrubFlush()
        }
      })

      if (typeof window !== 'undefined') {
        if (decodeLagTimer) {
          window.clearTimeout(decodeLagTimer)
        }
        decodeLagTimer = window.setTimeout(() => {
          decodeLagTimer = 0
          if (!awaitingVideoFrame) {
            return
          }

          awaitingVideoFrame = false
          decodeLagEvents += 1
          if (decodeLagEvents >= settings.maxDecodeLagEvents) {
            fallbackActiveMode('hold')
            return
          }

          if (pendingScrubProgress !== null) {
            queueScrubFlush()
          }
        }, settings.decodeLagGraceMs)
      }
    }
  }

  const prepareStandbyPlane = (assetIds: readonly LandingAssetId[]) => {
    const policy = getMediaPolicy()
    if (!policy || !shouldUseStandbyPlane(policy) || assetIds.length === 0) {
      mediaPool.releaseRole('standby')
      return
    }

    const activeAssetId = activeResolvedSegment?.activeAsset?.assetId ?? null
    const nextAssetId = assetIds.find((assetId) => assetId !== activeAssetId)
    if (!nextAssetId) {
      mediaPool.releaseRole('standby')
      return
    }

    const asset = assetRegistry.getAsset(nextAssetId, policy)
    if (asset.kind !== 'video') {
      mediaPool.releaseRole('standby')
      return
    }

    const standbyPlane = mediaPool.acquirePlane(asset, 'standby')
    if (!standbyPlane) {
      return
    }

    syncPlaneSource(standbyPlane, asset, 'hold')
    standbyPlane.element.pause()
  }

  const applyActiveSegment = () => {
    const policy = getMediaPolicy()
    if (!policy || !activeSegment) {
      return
    }

    activeResolvedSegment = assetRegistry.resolveSegment(activeSegment, policy)
    activeRuntimeMode = activeModeOverride ?? activeResolvedSegment.effectiveMode
    if (store.getState().readiness.fallbackMode !== 'none') {
      store.patch({
        readiness: {
          fallbackMode: activeModeOverride === 'poster' ? 'poster' : 'none',
        },
      })
    }
    updateRuntimeSnapshot(activeRuntimeMode)

    const activeAsset = activeResolvedSegment.activeAsset
    if (!activeAsset || activeRuntimeMode === 'poster' || activeAsset.kind !== 'video') {
      clearScrubState()
      mediaPool.releaseRole('active')
      prepareStandbyPlane(activeResolvedSegment.warmupTargets)
      return
    }

    const activePlane = mediaPool.acquirePlane(activeAsset, 'active')
    if (!activePlane) {
      fallbackActiveMode('poster')
      return
    }

    syncPlaneSource(activePlane, activeAsset, activeRuntimeMode)
    applyPlaybackMode()
    prepareStandbyPlane(activeResolvedSegment.warmupTargets)
  }

  const attachPlaneListeners = (plane: LandingMediaPlane) => {
    const handleLoadedMetadata = () => {
      const assetId = plane.asset?.assetId
      if (assetId) {
        updateReadiness(assetId, 'metadata-ready')
      }
    }

    const handleLoadedData = () => {
      const assetId = plane.asset?.assetId
      if (assetId) {
        updateReadiness(assetId, 'first-frame-ready')
      }
      if (plane.role === 'active') {
        applyPlaybackMode()
      }
    }

    const handleCanPlay = () => {
      const assetId = plane.asset?.assetId
      if (assetId) {
        updateReadiness(assetId, 'playable')
      }
      if (plane.role === 'active') {
        applyPlaybackMode()
      }
    }

    const handleError = () => {
      const assetId = plane.asset?.assetId
      if (assetId) {
        updateReadiness(assetId, 'failed')
      }
      if (plane.role === 'active') {
        fallbackActiveMode('poster')
      }
    }

    plane.element.addEventListener('loadedmetadata', handleLoadedMetadata)
    plane.element.addEventListener('loadeddata', handleLoadedData)
    plane.element.addEventListener('canplay', handleCanPlay)
    plane.element.addEventListener('error', handleError)
  }

  const enqueueAssetWarmup = (
    assetId: LandingAssetId,
    targetReadiness: LandingReadyTarget,
    policy: LandingMediaPolicy
  ) => {
    const currentReadiness = store.getState().media.assetReadiness[assetId] ?? 'idle'
    if (isReadinessSatisfied(currentReadiness, targetReadiness)) {
      return Promise.resolve()
    }

    const existing = preloadJobs.get(assetId)
    if (existing) {
      if (isReadinessSatisfied(existing.targetReadiness, targetReadiness)) {
        return existing.promise
      }

      const chained = existing.promise.then(() => preloadAsset(assetId, targetReadiness, policy))
      preloadJobs.set(assetId, {
        targetReadiness,
        promise: chained,
      })
      return chained
    }

    const promise = preloadAsset(assetId, targetReadiness, policy).finally(() => {
      const latest = preloadJobs.get(assetId)
      if (latest?.promise === promise) {
        preloadJobs.delete(assetId)
      }
    })

    preloadJobs.set(assetId, {
      targetReadiness,
      promise,
    })
    return promise
  }

  const runPreloadRequests = async (
    requests: {
      assetId: LandingAssetId
      targetReadiness: LandingReadyTarget
    }[],
    policy: LandingMediaPolicy
  ) => {
    const concurrency = Math.max(1, store.getState().performanceBudget?.maxConcurrentPreloads ?? 1)
    if (requests.length === 0) {
      return
    }

    let cursor = 0
    const workers = new Array(Math.min(concurrency, requests.length)).fill(null).map(async () => {
      while (cursor < requests.length) {
        const request = requests[cursor]
        cursor += 1
        await enqueueAssetWarmup(request.assetId, request.targetReadiness, policy)
      }
    })

    await Promise.all(workers)
  }

  return {
    attachMediaHost(element) {
      mediaHostCleanup?.()
      mediaHostCleanup = null
      mediaHostCleanup = mediaPool.attachHost(element)

      if (!element) {
        return () => undefined
      }

      const state = store.getState()
      if (state.mediaPolicy) {
        mediaPool.configure(state.mediaPolicy, state.performanceBudget)
      }
      applyActiveSegment()

      return () => {
        if (mediaHostCleanup) {
          mediaHostCleanup()
          mediaHostCleanup = null
        }
      }
    },
    activateScene(sceneId) {
      activeSceneId = sceneId
    },
    setActiveSegment(segment) {
      activeSegment = segment
      activeModeOverride = null
      clearScrubState()

      const state = store.getState()
      if (state.mediaPolicy) {
        mediaPool.configure(state.mediaPolicy, state.performanceBudget)
      }
      applyActiveSegment()
    },
    syncSegmentProgress(sceneId, progress) {
      const policy = getMediaPolicy()
      if (!policy || activeRuntimeMode !== 'scrub' || activeSceneId !== sceneId) {
        return
      }

      const settings = getScrubSettings(policy)
      if (!settings.enabled) {
        return
      }

      if (
        pendingScrubProgress !== null &&
        Math.abs(pendingScrubProgress - progress) <= settings.progressEpsilon
      ) {
        return
      }

      pendingScrubProgress = Math.max(0, Math.min(1, progress))
      queueScrubFlush()
    },
    async preloadRequests(requests) {
      const policy = store.getState().mediaPolicy
      if (!policy) {
        return
      }

      mediaPool.configure(policy, store.getState().performanceBudget)
      await runPreloadRequests(requests, policy)
    },
    async warmAssets(assetIds) {
      const policy = store.getState().mediaPolicy
      if (!policy || assetIds.length === 0) {
        return
      }

      const targetReadiness = getWarmupTargetReadiness(policy)
      await runPreloadRequests(
        assetIds.map((assetId) => ({
          assetId,
          targetReadiness,
        })),
        policy
      )
      prepareStandbyPlane(assetIds)
    },
    fallbackToPoster() {
      fallbackActiveMode('poster')
    },
    destroy() {
      mediaHostCleanup?.()
      mediaHostCleanup = null
      clearScrubState()
      preloadJobs.clear()
      mediaPool.forEachPlane((plane) => {
        plane.element.pause()
        plane.element.removeAttribute('src')
        plane.element.load()
      })
      mediaPool.destroy()
      activeResolvedSegment = null
      activeSegment = null
      activeSceneId = null
      activeModeOverride = null
      activeRuntimeMode = 'poster'
      store.patch({
        media: {
          activeAssetId: null,
          activePosterSrc: null,
          activeMode: 'poster',
        },
        readiness: {
          activeAssetReadyState: 'idle',
          fallbackMode: 'none',
        },
        preloader: {
          progress: 0,
          stage: 'boot',
        },
      })
    },
  }
}
