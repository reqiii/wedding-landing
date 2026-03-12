import { createLandingMediaController } from '@/lib/landing/media/mediaController'
import { createLandingRevealController } from '@/lib/landing/runtime/revealController'
import { createLandingWarmupCoordinator } from '@/lib/landing/runtime/warmupCoordinator'
import { getInitialLandingSegment } from '@/lib/landing/scenes/sceneSelectors'
import type { LandingSceneManifest } from '@/lib/landing/scenes/sceneTypes'
import { createLandingMotionSystem } from '@/lib/landing/runtime/motionSystem'
import { createLandingRuntimeStore, type LandingRuntimeStore } from '@/lib/landing/runtime/runtimeStore'
import { createLandingTierPolicies } from '@/lib/landing/tier/tierPolicies'
import { resolveLandingTierSnapshot } from '@/lib/landing/tier/tierResolver'

export type LandingBootstrap = {
  store: LandingRuntimeStore
  initialize: () => Promise<void>
  mountScene: (sceneRoot: HTMLElement) => () => void
  attachMediaHost: (mediaHost: HTMLElement | null) => () => void
  destroy: () => void
}

export function createLandingBootstrap(manifest: LandingSceneManifest): LandingBootstrap {
  const store = createLandingRuntimeStore(manifest.id)
  const mediaController = createLandingMediaController({
    manifest,
    store,
  })
  const warmupCoordinator = createLandingWarmupCoordinator({
    manifest,
    mediaController,
    store,
  })
  const revealController = createLandingRevealController({
    mediaController,
    store,
  })
  const motionSystem = createLandingMotionSystem({
    sceneManifest: manifest,
    mediaController,
    runtimeStore: store,
    warmupCoordinator,
  })

  let initialized = false

  return {
    store,
    async initialize() {
      if (initialized) {
        return
      }

      initialized = true
      const initializeStartedAtMs =
        typeof performance !== 'undefined' ? performance.now() : Date.now()
      revealController.beginInitialization()
      store.patch({
        debug: {
          performance: {
            startup: {
              initializeStartedAtMs,
              tierResolvedAtMs: null,
              criticalReadyAtMs: null,
              revealReadyAtMs: null,
              revealedAtMs: null,
              totalRevealMs: null,
            },
          },
        },
      })

      const tierSnapshot = await resolveLandingTierSnapshot()
      const policies = createLandingTierPolicies(tierSnapshot)
      const initialSegment = getInitialLandingSegment(manifest)
      const posterAssetId = initialSegment.media.posterAssetId ?? initialSegment.media.assetId

      store.patch({
        initialized: true,
        tierSnapshot,
        mediaPolicy: policies.mediaPolicy,
        motionPolicy: policies.motionPolicy,
        performanceBudget: policies.performanceBudget,
        readiness: {
          bootstrap: 'booting',
          bootstrapPhase: 'initializing',
          revealState: 'initializing',
          unlockTarget: policies.mediaPolicy.initialReadinessTarget,
          tierResolved: true,
        },
        debug: {
          lastDowngradeReason: tierSnapshot.downgradeReason,
          lastRevealFailureReason: null,
          performance: {
            startup: {
              tierResolvedAtMs:
                typeof performance !== 'undefined' ? performance.now() : Date.now(),
            },
          },
        },
      })
      revealController.markTierResolved(policies.mediaPolicy.initialReadinessTarget)

      mediaController.activateScene(manifest.id)
      mediaController.setActiveSegment(initialSegment)
      const criticalPlan = warmupCoordinator.getCriticalPlan()
      revealController.beginCriticalLoad({
        criticalAssetIds: criticalPlan.assetIds,
        posterAssetIds: posterAssetId ? [posterAssetId] : [],
        targetReadiness: policies.mediaPolicy.initialReadinessTarget,
      })
      await warmupCoordinator.loadCriticalAssets()
      revealController.markBootstrapReady()
      await revealController.waitForReveal()
      await warmupCoordinator.warmInitialAssets(initialSegment.id)
    },
    mountScene(sceneRoot) {
      return motionSystem.mount(sceneRoot)
    },
    attachMediaHost(mediaHost) {
      return mediaController.attachMediaHost(mediaHost)
    },
    destroy() {
      motionSystem.destroy()
      revealController.destroy()
      warmupCoordinator.destroy()
      mediaController.destroy()
    },
  }
}
