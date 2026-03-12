import type { LandingAssetId, LandingReadyTarget } from '@/lib/landing/core/contracts'
import {
  getCriticalMediaRequests,
  getDeferredMediaRequests,
  getInitialRevealMediaRequests,
  getWarmupTargetReadiness,
  type LandingMediaPreloadRequest,
} from '@/lib/landing/media/mediaPolicy'
import { isReadinessSatisfied } from '@/lib/landing/media/readinessMachine'
import type { LandingMediaController } from '@/lib/landing/media/mediaController'
import { getLandingWarmupTargets } from '@/lib/landing/scenes/sceneSelectors'
import type { LandingSceneManifest, LandingSegmentId } from '@/lib/landing/scenes/sceneTypes'
import type { LandingRuntimeStore } from '@/lib/landing/runtime/runtimeStore'
import type { LandingWarmupStage } from '@/lib/landing/runtime/runtimeTypes'

type LandingWarmupCoordinatorOptions = {
  manifest: LandingSceneManifest
  mediaController: LandingMediaController
  store: LandingRuntimeStore
}

type LandingWarmupBucketName = 'critical' | 'nearFuture' | 'background'

type LandingWarmupPlan = {
  requests: LandingMediaPreloadRequest[]
  assetIds: LandingAssetId[]
}

export type LandingWarmupCoordinator = {
  getCriticalPlan: () => LandingWarmupPlan
  loadCriticalAssets: () => Promise<LandingWarmupPlan>
  warmInitialAssets: (segmentId: LandingSegmentId | null) => Promise<void>
  warmBoundarySegment: (segmentId: LandingSegmentId | null) => Promise<void>
  refreshActiveSegment: () => Promise<void>
  destroy: () => void
}

function collapseRequests(requests: LandingMediaPreloadRequest[]) {
  const deduped = new Map<LandingAssetId, LandingMediaPreloadRequest>()

  for (let index = 0; index < requests.length; index += 1) {
    const request = requests[index]
    const existing = deduped.get(request.assetId)
    if (!existing) {
      deduped.set(request.assetId, { ...request })
      continue
    }

    if (
      request.targetReadiness === existing.targetReadiness ||
      (request.targetReadiness === 'poster-ready' && existing.targetReadiness !== 'poster-ready')
    ) {
      continue
    }

    const rank: Record<LandingReadyTarget, number> = {
      'poster-ready': 1,
      'metadata-ready': 2,
      'first-frame-ready': 3,
      playable: 4,
    }

    if (rank[request.targetReadiness] > rank[existing.targetReadiness]) {
      existing.targetReadiness = request.targetReadiness
    }
  }

  return Array.from(deduped.values())
}

function toAssetIds(requests: LandingMediaPreloadRequest[]) {
  return requests.map((request) => request.assetId)
}

export function createLandingWarmupCoordinator(
  options: LandingWarmupCoordinatorOptions
): LandingWarmupCoordinator {
  const { manifest, mediaController, store } = options
  let backgroundTask = 0

  const setBucketSummary = (
    bucket: LandingWarmupBucketName,
    requests: LandingMediaPreloadRequest[],
    stage: LandingWarmupStage
  ) => {
    const state = store.getState()
    const ready = requests.reduce((count, request) => {
      const readiness = state.media.assetReadiness[request.assetId] ?? 'idle'
      return count + (isReadinessSatisfied(readiness, request.targetReadiness) ? 1 : 0)
    }, 0)

    const currentBucket = state.warmup[bucket]
    if (
      state.warmup.stage === stage &&
      currentBucket.total === requests.length &&
      currentBucket.ready === ready
    ) {
      return
    }

    store.patch({
      warmup: {
        stage,
        [bucket]: {
          total: requests.length,
          ready,
        },
      },
    })
  }

  const preloadBucket = async (
    bucket: LandingWarmupBucketName,
    stage: LandingWarmupStage,
    requests: LandingMediaPreloadRequest[]
  ) => {
    setBucketSummary(bucket, requests, stage)
    if (requests.length === 0) {
      return
    }

    await mediaController.preloadRequests(requests)
    setBucketSummary(bucket, requests, stage)
  }

  const createWarmRequests = (assetIds: LandingAssetId[], targetReadiness: LandingReadyTarget) =>
    collapseRequests(
      assetIds.map((assetId) => ({
        assetId,
        targetReadiness,
        priority: 'high' as const,
      }))
    )

  const scheduleBackgroundWarmup = (requests: LandingMediaPreloadRequest[]) => {
    if (backgroundTask || typeof window === 'undefined' || requests.length === 0) {
      return
    }

    const run = () => {
      backgroundTask = 0
      void preloadBucket('background', 'background-assets', requests).finally(() => {
        const state = store.getState()
        if (state.warmup.stage === 'background-assets') {
          store.patch({
            warmup: {
              stage: 'idle',
            },
          })
        }
      })
    }

    if ('requestIdleCallback' in window && typeof window.requestIdleCallback === 'function') {
      backgroundTask = window.requestIdleCallback(run)
      return
    }

    backgroundTask = window.setTimeout(run, 0)
  }

  return {
    getCriticalPlan() {
      const policy = store.getState().mediaPolicy
      if (!policy) {
        return {
          requests: [],
          assetIds: [],
        }
      }

      const requests = collapseRequests(getInitialRevealMediaRequests(manifest, policy))
      return {
        requests,
        assetIds: toAssetIds(requests),
      }
    },
    async loadCriticalAssets() {
      const { requests, assetIds } = this.getCriticalPlan()
      await preloadBucket('critical', 'critical-assets', requests)
      return {
        requests,
        assetIds,
      }
    },
    async warmInitialAssets(segmentId) {
      const policy = store.getState().mediaPolicy
      if (!policy) {
        return
      }

      const targetReadiness = getWarmupTargetReadiness(policy)
      const nearFutureRequests = createWarmRequests(
        [
          ...getLandingWarmupTargets(manifest, segmentId, 'boot'),
          ...getLandingWarmupTargets(manifest, segmentId, 'after-critical'),
        ],
        targetReadiness
      )

      await preloadBucket('nearFuture', 'near-future-assets', nearFutureRequests)

      const excludedAssetIds = new Set<LandingAssetId>([
        ...toAssetIds(getInitialRevealMediaRequests(manifest, policy)),
        ...toAssetIds(nearFutureRequests),
      ])

      const backgroundRequests = collapseRequests([
        ...getCriticalMediaRequests(manifest, policy),
        ...getDeferredMediaRequests(manifest, policy),
      ]).filter((request) => !excludedAssetIds.has(request.assetId))

      scheduleBackgroundWarmup(backgroundRequests)
    },
    async warmBoundarySegment(segmentId) {
      const policy = store.getState().mediaPolicy
      if (!policy) {
        return
      }

      const targetReadiness = getWarmupTargetReadiness(policy)
      const requests = createWarmRequests(
        getLandingWarmupTargets(manifest, segmentId, 'on-enter'),
        targetReadiness
      )

      await preloadBucket('nearFuture', 'near-future-assets', requests)
    },
    async refreshActiveSegment() {
      await this.warmBoundarySegment(store.getState().motion.activeSegmentId)
    },
    destroy() {
      if (!backgroundTask || typeof window === 'undefined') {
        backgroundTask = 0
        return
      }

      if ('cancelIdleCallback' in window && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(backgroundTask)
      } else {
        window.clearTimeout(backgroundTask)
      }

      backgroundTask = 0
    },
  }
}
