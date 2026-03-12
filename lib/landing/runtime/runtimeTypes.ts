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
export type LandingBootstrapPhase = 'boot' | 'initializing' | 'critical-loading' | 'ready' | 'failed'
export type LandingRevealState =
  | 'boot'
  | 'initializing'
  | 'critical-loading'
  | 'ready-to-reveal'
  | 'revealed'
  | 'failed'
export type LandingFallbackMode = 'none' | 'poster'
export type LandingPreloaderStage =
  | 'boot'
  | 'tier'
  | 'critical-assets'
  | 'revealing'
  | 'fallback'
  | 'ready'
export type LandingWarmupStage =
  | 'idle'
  | 'critical-assets'
  | 'near-future-assets'
  | 'background-assets'

export type LandingWarmupBucket = {
  total: number
  ready: number
}

export type LandingStartupTelemetry = {
  initializeStartedAtMs: number | null
  tierResolvedAtMs: number | null
  criticalReadyAtMs: number | null
  revealReadyAtMs: number | null
  revealedAtMs: number | null
  totalRevealMs: number | null
}

export type LandingMotionTelemetry = {
  samples: number
  avgFrameMs: number
  maxFrameMs: number
  overBudgetFrames: number
  lastFrameMs: number
  fps: number | null
  lowFpsSamples: number
}

export type LandingMediaTelemetry = {
  seekCount: number
  decodeSamples: number
  avgDecodeLagMs: number
  maxDecodeLagMs: number
  decodeOverBudgetEvents: number
  fallbackCount: number
  totalVideoPlanes: number
  activeVideoPlanes: number
}

export type LandingRuntimeTelemetry = {
  longTaskCount: number
  maxLongTaskMs: number
  lastLongTaskMs: number
  mountedPanelCount: number
  stageNodeCount: number
}

export type LandingPerformanceTelemetry = {
  startup: LandingStartupTelemetry
  motion: LandingMotionTelemetry
  media: LandingMediaTelemetry
  runtime: LandingRuntimeTelemetry
}

export type LandingRuntimeState = {
  initialized: boolean
  sceneId: LandingSceneId
  tierSnapshot: LandingTierSnapshot | null
  performanceBudget: LandingPerformanceBudget | null
  mediaPolicy: LandingMediaPolicy | null
  motionPolicy: LandingMotionPolicy | null
  readiness: {
    bootstrap: LandingBootstrapStatus
    bootstrapPhase: LandingBootstrapPhase
    revealState: LandingRevealState
    unlockTarget: LandingReadyTarget
    criticalReadyState: LandingReadinessState
    activeAssetReadyState: LandingReadinessState
    motionReady: boolean
    tierResolved: boolean
    fallbackMode: LandingFallbackMode
  }
  preloader: {
    stage: LandingPreloaderStage
    progress: number
  }
  warmup: {
    stage: LandingWarmupStage
    critical: LandingWarmupBucket
    nearFuture: LandingWarmupBucket
    background: LandingWarmupBucket
  }
  motion: {
    activeSegmentId: LandingSegmentId | null
    activeSceneId: LandingSceneId | null
  }
  media: {
    activeAssetId: LandingAssetId | null
    activePosterSrc: string | null
    activeMode: LandingMediaMode
    assetReadiness: Partial<Record<LandingAssetId, LandingReadinessState>>
  }
  debug: {
    lastDowngradeReason: string | null
    lastRevealFailureReason: string | null
    performance: LandingPerformanceTelemetry
  }
}
