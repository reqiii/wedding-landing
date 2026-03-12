import { createLandingMediaController } from '@/lib/landing/media/mediaController'
import { getInitialLandingSegment, getLandingWarmupTargets } from '@/lib/landing/scenes/sceneSelectors'
import type { LandingSceneManifest } from '@/lib/landing/scenes/sceneTypes'
import { createLandingMotionSystem } from '@/lib/landing/runtime/motionSystem'
import { createLandingRuntimeStore, type LandingRuntimeStore } from '@/lib/landing/runtime/runtimeStore'
import { createLandingTierPolicies } from '@/lib/landing/tier/tierPolicies'
import { resolveLandingTierSnapshot } from '@/lib/landing/tier/tierResolver'

export type LandingBootstrap = {
  store: LandingRuntimeStore
  initialize: () => Promise<void>
  mountScene: (sceneRoot: HTMLElement) => () => void
  attachVideoElement: (videoElement: HTMLVideoElement | null) => () => void
  destroy: () => void
}

export function createLandingBootstrap(manifest: LandingSceneManifest): LandingBootstrap {
  const store = createLandingRuntimeStore(manifest.id)
  const mediaController = createLandingMediaController({
    manifest,
    store,
  })
  const motionSystem = createLandingMotionSystem({
    sceneManifest: manifest,
    mediaController,
    runtimeStore: store,
  })

  let initialized = false

  return {
    store,
    async initialize() {
      if (initialized) {
        return
      }

      initialized = true

      const tierSnapshot = await resolveLandingTierSnapshot()
      const policies = createLandingTierPolicies(tierSnapshot)
      const initialSegment = getInitialLandingSegment(manifest)

      store.patch({
        initialized: true,
        tierSnapshot,
        mediaPolicy: policies.mediaPolicy,
        motionPolicy: policies.motionPolicy,
        performanceBudget: policies.performanceBudget,
        readiness: {
          bootstrap: 'booting',
          unlockTarget: policies.mediaPolicy.initialReadinessTarget,
        },
        debug: {
          lastDowngradeReason: tierSnapshot.downgradeReason,
        },
      })

      mediaController.activateScene(manifest.id)
      mediaController.setActiveSegment(initialSegment)
      await mediaController.primeCriticalAssets()
      await mediaController.warmAssets(getLandingWarmupTargets(manifest, initialSegment.id))
    },
    mountScene(sceneRoot) {
      return motionSystem.mount(sceneRoot)
    },
    attachVideoElement(videoElement) {
      return mediaController.attachVideoElement(videoElement)
    },
    destroy() {
      motionSystem.destroy()
      mediaController.destroy()
    },
  }
}
