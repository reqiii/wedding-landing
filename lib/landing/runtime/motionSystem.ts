import { createScrollEngine } from '@/lib/landing/runtime/scrollEngine'
import type { LandingMediaController } from '@/lib/landing/media/mediaController'
import {
  getInitialLandingSegment,
  getLandingSegmentById,
  getLandingWarmupTargets,
} from '@/lib/landing/scenes/sceneSelectors'
import type { LandingSceneManifest, LandingSegmentId } from '@/lib/landing/scenes/sceneTypes'
import type { LandingRuntimeStore } from '@/lib/landing/runtime/runtimeStore'

type LandingMotionSystemOptions = {
  manifest: LandingSceneManifest
  mediaController: LandingMediaController
  store: LandingRuntimeStore
}

export type LandingMotionSystem = {
  mount: (sceneRoot: HTMLElement) => () => void
  destroy: () => void
}

export function createLandingMotionSystem(
  options: LandingMotionSystemOptions
): LandingMotionSystem {
  const { manifest, mediaController, store } = options
  const scrollEngine = createScrollEngine<LandingSegmentId>({
    onDocumentProgress(progress) {
      store.setDocumentProgress(progress)
    },
  })

  const warmSegmentTargets = (segmentId: LandingSegmentId | null) => {
    const mediaPolicy = store.getState().mediaPolicy
    if (!mediaPolicy || mediaPolicy.warmupStrategy === 'none') {
      return
    }

    const targets = getLandingWarmupTargets(manifest, segmentId)
    if (targets.length === 0) {
      return
    }

    void mediaController.warmAssets(targets)
  }

  return {
    mount(sceneRoot) {
      const initialSegment = getInitialLandingSegment(manifest)
      mediaController.setActiveSegment(initialSegment)
      store.setActiveSegment(initialSegment.id)
      warmSegmentTargets(initialSegment.id)

      return scrollEngine.register({
        id: manifest.id,
        element: sceneRoot,
        segments: manifest.segments.map((segment) => ({
          id: segment.id,
          lengthVh: segment.lengthVh,
        })),
        onActiveSegmentChange(segmentId) {
          const segment = getLandingSegmentById(manifest, segmentId) ?? initialSegment
          store.setActiveSegment(segment.id)
          mediaController.setActiveSegment(segment)
          warmSegmentTargets(segment.id)
        },
        onStateChange(state) {
          const segment = getLandingSegmentById(manifest, state.activeSegmentId)
          if (!segment) {
            return
          }

          mediaController.syncSegmentProgress(state.segmentProgressById[segment.id] ?? 0)
        },
      })
    },
    destroy() {
      scrollEngine.destroy()
    },
  }
}
