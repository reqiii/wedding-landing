import { useSyncExternalStore } from 'react'
import type { LandingReadinessState } from '@/lib/landing/core/contracts'
import type { LandingSceneId } from '@/lib/landing/scenes/sceneTypes'
import type { LandingRuntimeState } from '@/lib/landing/runtime/runtimeTypes'

type Listener = () => void

type LandingDebugPatch = Partial<
  Omit<LandingRuntimeState['debug'], 'performance'>
> & {
  performance?: {
    startup?: Partial<LandingRuntimeState['debug']['performance']['startup']>
    motion?: Partial<LandingRuntimeState['debug']['performance']['motion']>
    media?: Partial<LandingRuntimeState['debug']['performance']['media']>
    runtime?: Partial<LandingRuntimeState['debug']['performance']['runtime']>
  }
}

type LandingRuntimePatch = Partial<
  Omit<LandingRuntimeState, 'readiness' | 'preloader' | 'warmup' | 'motion' | 'media' | 'debug'>
> & {
  readiness?: Partial<LandingRuntimeState['readiness']>
  preloader?: Partial<LandingRuntimeState['preloader']>
  warmup?: Partial<LandingRuntimeState['warmup']> & {
    critical?: Partial<LandingRuntimeState['warmup']['critical']>
    nearFuture?: Partial<LandingRuntimeState['warmup']['nearFuture']>
    background?: Partial<LandingRuntimeState['warmup']['background']>
  }
  motion?: Partial<LandingRuntimeState['motion']>
  media?: Partial<Omit<LandingRuntimeState['media'], 'assetReadiness'>> & {
    assetReadiness?: Partial<LandingRuntimeState['media']['assetReadiness']>
  }
  debug?: LandingDebugPatch
}

export type LandingRuntimeStore = {
  getState: () => LandingRuntimeState
  subscribe: (listener: Listener) => () => void
  patch: (next: LandingRuntimePatch) => void
  setMotionBoundary: (
    sceneId: LandingRuntimeState['motion']['activeSceneId'],
    segmentId: LandingRuntimeState['motion']['activeSegmentId']
  ) => void
  setAssetReadiness: (
    assetId: NonNullable<LandingRuntimeState['media']['activeAssetId']>,
    readiness: LandingReadinessState
  ) => void
}

function createInitialState(sceneId: LandingSceneId): LandingRuntimeState {
  return {
    initialized: false,
    sceneId,
    tierSnapshot: null,
    performanceBudget: null,
    mediaPolicy: null,
    motionPolicy: null,
    readiness: {
      bootstrap: 'booting',
      bootstrapPhase: 'boot',
      revealState: 'boot',
      unlockTarget: 'poster-ready',
      criticalReadyState: 'idle',
      activeAssetReadyState: 'idle',
      motionReady: false,
      tierResolved: false,
      fallbackMode: 'none',
    },
    preloader: {
      stage: 'boot',
      progress: 0,
    },
    warmup: {
      stage: 'idle',
      critical: {
        total: 0,
        ready: 0,
      },
      nearFuture: {
        total: 0,
        ready: 0,
      },
      background: {
        total: 0,
        ready: 0,
      },
    },
    motion: {
      activeSegmentId: null,
      activeSceneId: null,
    },
    media: {
      activeAssetId: null,
      activePosterSrc: null,
      activePosterReadyState: 'idle',
      activeMode: 'poster',
      assetReadiness: {},
    },
    debug: {
      lastDowngradeReason: null,
      lastRevealFailureReason: null,
      performance: {
        startup: {
          initializeStartedAtMs: null,
          tierResolvedAtMs: null,
          criticalReadyAtMs: null,
          revealReadyAtMs: null,
          revealedAtMs: null,
          totalRevealMs: null,
        },
        motion: {
          samples: 0,
          avgFrameMs: 0,
          maxFrameMs: 0,
          overBudgetFrames: 0,
          lastFrameMs: 0,
          fps: null,
          lowFpsSamples: 0,
        },
        media: {
          seekCount: 0,
          decodeSamples: 0,
          avgDecodeLagMs: 0,
          maxDecodeLagMs: 0,
          decodeOverBudgetEvents: 0,
          fallbackCount: 0,
          totalVideoPlanes: 0,
          activeVideoPlanes: 0,
        },
        runtime: {
          longTaskCount: 0,
          maxLongTaskMs: 0,
          lastLongTaskMs: 0,
          mountedPanelCount: 0,
          stageNodeCount: 0,
        },
      },
    },
  }
}

function mergeBranch<T extends Record<string, unknown>>(current: T, next?: Partial<T>) {
  if (!next) {
    return current
  }

  let changed = false
  const merged = { ...current }
  const keys = Object.keys(next) as (keyof T)[]
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index]
    const value = next[key]
    if (value === undefined || Object.is(current[key], value)) {
      continue
    }

    merged[key] = value as T[keyof T]
    changed = true
  }

  return changed ? merged : current
}

export function createLandingRuntimeStore(sceneId: LandingSceneId): LandingRuntimeStore {
  let state = createInitialState(sceneId)
  const listeners = new Set<Listener>()

  const emit = () => {
    listeners.forEach((listener) => listener())
  }

  return {
    getState() {
      return state
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    patch(next) {
      const {
        readiness: nextReadinessPatch,
        preloader: nextPreloaderPatch,
        warmup: nextWarmupPatch,
        motion: nextMotionPatch,
        media: nextMediaPatch,
        debug: nextDebugPatch,
        ...topLevelPatch
      } = next

      const readiness = mergeBranch(state.readiness, nextReadinessPatch)
      const preloader = mergeBranch(state.preloader, nextPreloaderPatch)
      const warmupCritical = mergeBranch(state.warmup.critical, nextWarmupPatch?.critical)
      const warmupNearFuture = mergeBranch(state.warmup.nearFuture, nextWarmupPatch?.nearFuture)
      const warmupBackground = mergeBranch(state.warmup.background, nextWarmupPatch?.background)
      const warmupBase = mergeBranch(state.warmup, nextWarmupPatch)
      const warmup =
        warmupBase === state.warmup &&
        warmupCritical === state.warmup.critical &&
        warmupNearFuture === state.warmup.nearFuture &&
        warmupBackground === state.warmup.background
          ? state.warmup
          : {
              ...warmupBase,
              critical: warmupCritical,
              nearFuture: warmupNearFuture,
              background: warmupBackground,
            }
      const motion = mergeBranch(state.motion, nextMotionPatch)
      const mediaAssetReadiness = mergeBranch(state.media.assetReadiness, nextMediaPatch?.assetReadiness)
      const mediaBase = mergeBranch(state.media, nextMediaPatch)
      const media =
        mediaBase === state.media && mediaAssetReadiness === state.media.assetReadiness
          ? state.media
          : {
              ...mediaBase,
              assetReadiness: mediaAssetReadiness,
            }
      const debugPerformanceStartup = mergeBranch(
        state.debug.performance.startup,
        nextDebugPatch?.performance?.startup
      )
      const debugPerformanceMotion = mergeBranch(
        state.debug.performance.motion,
        nextDebugPatch?.performance?.motion
      )
      const debugPerformanceMedia = mergeBranch(
        state.debug.performance.media,
        nextDebugPatch?.performance?.media
      )
      const debugPerformanceRuntime = mergeBranch(
        state.debug.performance.runtime,
        nextDebugPatch?.performance?.runtime
      )
      const debugPerformance =
        debugPerformanceStartup === state.debug.performance.startup &&
        debugPerformanceMotion === state.debug.performance.motion &&
        debugPerformanceMedia === state.debug.performance.media &&
        debugPerformanceRuntime === state.debug.performance.runtime
          ? state.debug.performance
          : {
              startup: debugPerformanceStartup,
              motion: debugPerformanceMotion,
              media: debugPerformanceMedia,
              runtime: debugPerformanceRuntime,
            }
      const debugBase = mergeBranch(state.debug, {
        lastDowngradeReason: nextDebugPatch?.lastDowngradeReason,
        lastRevealFailureReason: nextDebugPatch?.lastRevealFailureReason,
      })
      const debug =
        debugBase === state.debug && debugPerformance === state.debug.performance
          ? state.debug
          : {
              ...debugBase,
              performance: debugPerformance,
            }

      let hasTopLevelChange = false
      const topLevelKeys = Object.keys(topLevelPatch) as (keyof typeof topLevelPatch)[]
      for (let index = 0; index < topLevelKeys.length; index += 1) {
        const key = topLevelKeys[index]
        const value = topLevelPatch[key]
        if (value === undefined || Object.is(state[key], value)) {
          continue
        }

        hasTopLevelChange = true
        break
      }

      if (
        !hasTopLevelChange &&
        readiness === state.readiness &&
        preloader === state.preloader &&
        warmup === state.warmup &&
        motion === state.motion &&
        media === state.media &&
        debug === state.debug
      ) {
        return
      }

      state = {
        ...state,
        ...topLevelPatch,
        readiness,
        preloader,
        warmup,
        motion,
        media,
        debug,
      }
      emit()
    },
    setMotionBoundary(sceneId, segmentId) {
      if (
        state.motion.activeSceneId === sceneId &&
        state.motion.activeSegmentId === segmentId
      ) {
        return
      }

      state = {
        ...state,
        motion: {
          ...state.motion,
          activeSceneId: sceneId,
          activeSegmentId: segmentId,
        },
      }
      emit()
    },
    setAssetReadiness(assetId, readiness) {
      const current = state.media.assetReadiness[assetId]
      if (current === readiness) {
        return
      }

      state = {
        ...state,
        media: {
          ...state.media,
          assetReadiness: {
            ...state.media.assetReadiness,
            [assetId]: readiness,
          },
        },
        readiness: {
          ...state.readiness,
          activeAssetReadyState:
            state.media.activeAssetId === assetId ? readiness : state.readiness.activeAssetReadyState,
        },
      }
      emit()
    },
  }
}

export function useLandingRuntimeSelector<T>(
  store: LandingRuntimeStore,
  selector: (state: LandingRuntimeState) => T
) {
  const getSnapshot = () => selector(store.getState())
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot)
}
