import type {
  LandingAssetId,
  LandingMediaMode,
  LandingReadinessState,
  LandingReadyTarget,
} from '@/lib/landing/core/contracts'
import type { LandingSceneId, LandingSegmentId } from '@/lib/landing/scenes/sceneTypes'
import type {
  LandingMediaPolicy,
  LandingMotionPolicy,
  LandingPerformanceBudget,
  LandingTierSnapshot,
} from '@/lib/landing/tier/tierTypes'

export type LandingBootstrapStatus = 'booting' | 'ready'

export type LandingRuntimeState = {
  initialized: boolean
  sceneId: LandingSceneId
  tierSnapshot: LandingTierSnapshot | null
  performanceBudget: LandingPerformanceBudget | null
  mediaPolicy: LandingMediaPolicy | null
  motionPolicy: LandingMotionPolicy | null
  readiness: {
    bootstrap: LandingBootstrapStatus
    unlockTarget: LandingReadyTarget
    activeAssetReadyState: LandingReadinessState
  }
  motion: {
    activeSegmentId: LandingSegmentId | null
    activeSceneId: LandingSceneId | null
    documentProgress: number
  }
  media: {
    activeAssetId: LandingAssetId | null
    activePosterSrc: string | null
    activeMode: LandingMediaMode
    assetReadiness: Partial<Record<LandingAssetId, LandingReadinessState>>
  }
  debug: {
    lastDowngradeReason: string | null
  }
}
