import type { LandingAssetId, LandingReadinessState, LandingReadyTarget } from '@/lib/landing/core/contracts'
import type { LandingMediaController } from '@/lib/landing/media/mediaController'
import { isReadinessSatisfied, resolveLowestReadyState } from '@/lib/landing/media/readinessMachine'
import type { LandingRuntimeStore } from '@/lib/landing/runtime/runtimeStore'

const CRITICAL_READINESS_STALL_MS = 4500

type LandingRevealControllerOptions = {
  mediaController: LandingMediaController
  store: LandingRuntimeStore
}

type LandingRevealPlan = {
  criticalAssetIds: LandingAssetId[]
  posterAssetIds: LandingAssetId[]
  targetReadiness: LandingReadyTarget
}

export type LandingRevealController = {
  beginInitialization: () => void
  markTierResolved: (unlockTarget: LandingReadyTarget) => void
  beginCriticalLoad: (plan: LandingRevealPlan) => void
  markBootstrapReady: () => void
  waitForReveal: () => Promise<void>
  destroy: () => void
}

function resolveCriticalReadyState(
  assetIds: readonly LandingAssetId[],
  readinessMap: Partial<Record<LandingAssetId, LandingReadinessState>>
) {
  if (assetIds.length === 0) {
    return 'idle'
  }

  return resolveLowestReadyState(assetIds.map((assetId) => readinessMap[assetId] ?? 'idle'))
}

function resolvePosterFallbackReadyState(
  state: ReturnType<LandingRuntimeStore['getState']>
): LandingReadinessState {
  const posterReadyState = state.media.activePosterReadyState
  if (posterReadyState === 'failed') {
    return 'failed'
  }

  return isReadinessSatisfied(posterReadyState, 'poster-ready') ? 'poster-ready' : 'idle'
}

function resolvePreloaderStage(state: ReturnType<LandingRuntimeStore['getState']>) {
  if (state.readiness.revealState === 'revealed') {
    return 'ready'
  }

  if (state.readiness.revealState === 'ready-to-reveal') {
    return 'revealing'
  }

  if (state.readiness.fallbackMode === 'poster') {
    return 'fallback'
  }

  if (!state.readiness.tierResolved) {
    return 'tier'
  }

  if (
    state.readiness.revealState === 'critical-loading' ||
    state.readiness.bootstrapPhase === 'critical-loading'
  ) {
    return 'critical-assets'
  }

  if (state.readiness.revealState === 'failed') {
    return 'fallback'
  }

  return 'boot'
}

function resolveCriticalProgress(
  current: LandingReadinessState,
  target: LandingReadyTarget
) {
  const progressByState: Record<LandingReadinessState, number> = {
    idle: 0,
    'poster-ready': target === 'poster-ready' ? 1 : 0.34,
    'metadata-ready': target === 'metadata-ready' ? 1 : 0.67,
    'first-frame-ready': target === 'first-frame-ready' ? 1 : 0.9,
    playable: 1,
    failed: 0,
  }

  return progressByState[current]
}

function readNow() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function resolvePreloaderProgress(state: ReturnType<LandingRuntimeStore['getState']>) {
  if (state.readiness.revealState === 'revealed') {
    return 1
  }

  if (state.readiness.revealState === 'failed') {
    return 0.92
  }

  const progress =
    (state.readiness.tierResolved ? 0.18 : 0.04) +
    (state.readiness.motionReady ? 0.2 : 0) +
    (state.readiness.bootstrap === 'ready' ? 0.18 : 0) +
    resolveCriticalProgress(state.readiness.criticalReadyState, state.readiness.unlockTarget) * 0.36 +
    (state.readiness.revealState === 'ready-to-reveal' ? 0.08 : 0)

  return Math.max(0, Math.min(1, progress))
}

export function createLandingRevealController(
  options: LandingRevealControllerOptions
): LandingRevealController {
  const { mediaController, store } = options
  let detachStoreSubscription: (() => void) | null = null
  let revealPlan: LandingRevealPlan = {
    criticalAssetIds: [],
    posterAssetIds: [],
    targetReadiness: 'poster-ready',
  }
  let stallTimer = 0
  let stallDetected = false
  let revealFrame = 0
  let reconcileQueued = false
  const waiters = new Set<() => void>()
  let criticalReadyAtMs: number | null = null
  let revealReadyAtMs: number | null = null
  const getCriticalReadinessStallMs = () =>
    store.getState().performanceBudget?.criticalRevealStallMs ?? CRITICAL_READINESS_STALL_MS

  const clearStallTimer = () => {
    if (!stallTimer || typeof window === 'undefined') {
      stallTimer = 0
      return
    }

    window.clearTimeout(stallTimer)
    stallTimer = 0
  }

  const startStallTimer = () => {
    clearStallTimer()
    if (typeof window === 'undefined') {
      return
    }

    stallTimer = window.setTimeout(() => {
      stallTimer = 0
      stallDetected = true
      scheduleReconcile()
    }, getCriticalReadinessStallMs())
  }

  const resolveWaiters = () => {
    waiters.forEach((resolve) => resolve())
    waiters.clear()
  }

  const patchDerivedState = (
    next: Partial<ReturnType<LandingRuntimeStore['getState']>['readiness']>,
    stage?: ReturnType<typeof resolvePreloaderStage>,
    progress?: number
  ) => {
    const state = store.getState()
    const readinessPatch: Partial<typeof state.readiness> = {}
    let hasReadinessPatch = false

    const readinessKeys = Object.keys(next) as (keyof typeof state.readiness)[]
    for (let index = 0; index < readinessKeys.length; index += 1) {
      const key = readinessKeys[index]
      const value = next[key]
      if (value === undefined || state.readiness[key] === value) {
        continue
      }

      ;(readinessPatch as Record<string, unknown>)[key] = value
      hasReadinessPatch = true
    }

    const preloaderPatch: Partial<typeof state.preloader> = {}
    let hasPreloaderPatch = false
    if (stage && state.preloader.stage !== stage) {
      preloaderPatch.stage = stage
      hasPreloaderPatch = true
    }

    if (
      typeof progress === 'number' &&
      Math.abs(state.preloader.progress - progress) > 0.001
    ) {
      preloaderPatch.progress = progress
      hasPreloaderPatch = true
    }

    if (!hasReadinessPatch && !hasPreloaderPatch) {
      return
    }

    store.patch({
      readiness: hasReadinessPatch ? readinessPatch : undefined,
      preloader: hasPreloaderPatch ? preloaderPatch : undefined,
    })
  }

  const failReveal = (reason: string) => {
    clearStallTimer()

    const state = store.getState()
    if (state.readiness.revealState === 'failed') {
      return
    }

    store.patch({
      readiness: {
        bootstrapPhase: 'failed',
        revealState: 'failed',
      },
      preloader: {
        stage: 'fallback',
        progress: 0.92,
      },
      debug: {
        lastRevealFailureReason: reason,
      },
    })
  }

  const queueReveal = () => {
    if (revealFrame || typeof window === 'undefined') {
      return
    }

    revealFrame = window.requestAnimationFrame(() => {
      revealFrame = 0
      const state = store.getState()
      if (state.readiness.revealState !== 'ready-to-reveal') {
        return
      }

      const revealedAtMs = readNow()
      const initializeStartedAtMs = state.debug.performance.startup.initializeStartedAtMs

      store.patch({
        readiness: {
          revealState: 'revealed',
        },
        preloader: {
          stage: 'ready',
          progress: 1,
        },
        debug: {
          performance: {
            startup: {
              criticalReadyAtMs,
              revealReadyAtMs,
              revealedAtMs,
              totalRevealMs:
                initializeStartedAtMs === null ? null : Math.max(0, revealedAtMs - initializeStartedAtMs),
            },
          },
        },
      })
    })
  }

  const startPosterFallback = (reason: string) => {
    const posterAssetIds = revealPlan.posterAssetIds
    if (posterAssetIds.length === 0) {
      failReveal(reason)
      return
    }

    clearStallTimer()
    stallDetected = false
    revealPlan = {
      criticalAssetIds: posterAssetIds,
      posterAssetIds,
      targetReadiness: 'poster-ready',
    }

    mediaController.fallbackToPoster(reason)
    store.patch({
      readiness: {
        fallbackMode: 'poster',
        unlockTarget: 'poster-ready',
      },
      preloader: {
        stage: 'fallback',
      },
      debug: {
        lastRevealFailureReason: reason,
      },
    })
  }

  const reconcile = () => {
    const state = store.getState()
    const criticalReadyState =
      state.readiness.fallbackMode === 'poster'
        ? resolvePosterFallbackReadyState(state)
        : resolveCriticalReadyState(revealPlan.criticalAssetIds, state.media.assetReadiness)
    const stage = resolvePreloaderStage(state)
    const progress = resolvePreloaderProgress({
      ...state,
      readiness: {
        ...state.readiness,
        criticalReadyState,
      },
    })

    patchDerivedState(
      {
        criticalReadyState,
      },
      stage,
      progress
    )

    const freshState = store.getState()
    if (freshState.readiness.revealState === 'revealed' || freshState.readiness.revealState === 'failed') {
      resolveWaiters()
      return
    }

    if (criticalReadyAtMs === null && isReadinessSatisfied(criticalReadyState, revealPlan.targetReadiness)) {
      criticalReadyAtMs = readNow()
    }

    if (criticalReadyState === 'failed') {
      if (freshState.readiness.fallbackMode === 'poster') {
        failReveal('poster fallback failed to reach poster readiness')
      } else {
        startPosterFallback('critical media failed before reveal')
      }
      return
    }

    if (stallDetected && freshState.readiness.fallbackMode !== 'poster') {
      startPosterFallback('critical readiness stalled before reveal')
      return
    }

    const revealReady =
      freshState.readiness.bootstrap === 'ready' &&
      freshState.readiness.tierResolved &&
      freshState.readiness.motionReady &&
      isReadinessSatisfied(criticalReadyState, revealPlan.targetReadiness)

    if (!revealReady) {
      return
    }

    clearStallTimer()
    patchDerivedState(
      {
        revealState: 'ready-to-reveal',
      },
      'revealing',
      0.98
    )
    if (revealReadyAtMs === null) {
      revealReadyAtMs = readNow()
    }
    queueReveal()
  }

  const scheduleReconcile = () => {
    if (reconcileQueued) {
      return
    }

    reconcileQueued = true
    queueMicrotask(() => {
      reconcileQueued = false
      reconcile()
    })
  }

  detachStoreSubscription = store.subscribe(scheduleReconcile)
  const handleVisibilityChange = () => {
    const state = store.getState()
    if (
      state.readiness.revealState !== 'critical-loading' ||
      state.readiness.fallbackMode === 'poster'
    ) {
      return
    }

    if (!stallTimer) {
      startStallTimer()
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  return {
    beginInitialization() {
      store.patch({
        readiness: {
          bootstrap: 'booting',
          bootstrapPhase: 'initializing',
          revealState: 'initializing',
          fallbackMode: 'none',
        },
        preloader: {
          stage: 'tier',
          progress: 0.04,
        },
        debug: {
          performance: {
            startup: {
              initializeStartedAtMs:
                store.getState().debug.performance.startup.initializeStartedAtMs ?? readNow(),
            },
          },
        },
      })
    },
    markTierResolved(unlockTarget) {
      patchDerivedState(
        {
          tierResolved: true,
          unlockTarget,
        },
        'critical-assets',
        0.18
      )
      store.patch({
        debug: {
          performance: {
            startup: {
              tierResolvedAtMs: readNow(),
            },
          },
        },
      })
    },
    beginCriticalLoad(plan) {
      revealPlan = {
        criticalAssetIds: plan.criticalAssetIds,
        posterAssetIds: plan.posterAssetIds,
        targetReadiness: plan.targetReadiness,
      }
      criticalReadyAtMs = null
      revealReadyAtMs = null
      stallDetected = false
      startStallTimer()

      store.patch({
        readiness: {
          bootstrapPhase: 'critical-loading',
          revealState: 'critical-loading',
          unlockTarget: plan.targetReadiness,
        },
        preloader: {
          stage: 'critical-assets',
        },
      })
      scheduleReconcile()
    },
    markBootstrapReady() {
      patchDerivedState(
        {
          bootstrap: 'ready',
          bootstrapPhase: 'ready',
        },
        undefined,
        resolvePreloaderProgress(store.getState())
      )
      scheduleReconcile()
    },
    waitForReveal() {
      const state = store.getState()
      if (state.readiness.revealState === 'revealed' || state.readiness.revealState === 'failed') {
        return Promise.resolve()
      }

      return new Promise<void>((resolve) => {
        waiters.add(resolve)
      })
    },
    destroy() {
      clearStallTimer()
      if (revealFrame && typeof window !== 'undefined') {
        window.cancelAnimationFrame(revealFrame)
        revealFrame = 0
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
      detachStoreSubscription?.()
      detachStoreSubscription = null
      reconcileQueued = false
      waiters.clear()
    },
  }
}
