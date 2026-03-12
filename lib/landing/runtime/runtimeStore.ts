import { useSyncExternalStore } from 'react'
import type { LandingReadinessState } from '@/lib/landing/core/contracts'
import type { LandingSceneId } from '@/lib/landing/scenes/sceneTypes'
import type { LandingRuntimeState } from '@/lib/landing/runtime/runtimeTypes'

type Listener = () => void

type LandingRuntimePatch = Partial<
  Omit<LandingRuntimeState, 'readiness' | 'motion' | 'media' | 'debug'>
> & {
  readiness?: Partial<LandingRuntimeState['readiness']>
  motion?: Partial<LandingRuntimeState['motion']>
  media?: Partial<Omit<LandingRuntimeState['media'], 'assetReadiness'>> & {
    assetReadiness?: Partial<LandingRuntimeState['media']['assetReadiness']>
  }
  debug?: Partial<LandingRuntimeState['debug']>
}

export type LandingRuntimeStore = {
  getState: () => LandingRuntimeState
  subscribe: (listener: Listener) => () => void
  patch: (next: LandingRuntimePatch) => void
  setActiveSegment: (segmentId: LandingRuntimeState['motion']['activeSegmentId']) => void
  setDocumentProgress: (progress: number) => void
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
      unlockTarget: 'poster-ready',
      activeAssetReadyState: 'idle',
    },
    motion: {
      activeSegmentId: null,
      activeSceneId: sceneId,
      documentProgress: 0,
    },
    media: {
      activeAssetId: null,
      activePosterSrc: null,
      activeMode: 'poster',
      assetReadiness: {},
    },
    debug: {
      lastDowngradeReason: null,
    },
  }
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
      state = {
        ...state,
        ...next,
        readiness: {
          ...state.readiness,
          ...next.readiness,
        },
        motion: {
          ...state.motion,
          ...next.motion,
        },
        media: {
          ...state.media,
          ...next.media,
          assetReadiness: {
            ...state.media.assetReadiness,
            ...next.media?.assetReadiness,
          },
        },
        debug: {
          ...state.debug,
          ...next.debug,
        },
      }
      emit()
    },
    setActiveSegment(segmentId) {
      if (state.motion.activeSegmentId === segmentId) {
        return
      }

      state = {
        ...state,
        motion: {
          ...state.motion,
          activeSegmentId: segmentId,
        },
      }
      emit()
    },
    setDocumentProgress(progress) {
      const normalized = Math.max(0, Math.min(1, progress))
      if (Math.abs(state.motion.documentProgress - normalized) < 0.02) {
        return
      }

      state = {
        ...state,
        motion: {
          ...state.motion,
          documentProgress: normalized,
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
