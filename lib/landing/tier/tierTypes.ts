import type {
  LandingDeviceProfile,
  LandingReadyTarget,
  LandingViewportClass,
} from '@/lib/landing/core/contracts'

export type LandingTierId =
  | 'tier-0-poster'
  | 'tier-1-hold'
  | 'tier-2-balanced'
  | 'tier-3-premium'

export type LandingTierSnapshot = {
  tier: LandingTierId
  viewportClass: LandingViewportClass
  mediaProfile: LandingDeviceProfile
  prefersReducedMotion: boolean
  saveData: boolean
  effectiveType: string | null
  hardwareConcurrency: number | null
  deviceMemory: number | null
  downgradeReason: string | null
}

export type LandingMediaPolicy = {
  tier: LandingTierId
  deviceProfile: LandingDeviceProfile
  allowVideo: boolean
  allowScrub: boolean
  preferPoster: boolean
  standbyPoolSize: number
  preloadStrategy: 'poster' | 'metadata' | 'first-frame'
  initialReadinessTarget: LandingReadyTarget
  warmupStrategy: 'none' | 'adjacent' | 'aggressive'
}

export type LandingMotionPolicy = {
  tier: LandingTierId
  mountStrategy: 'active-only' | 'active-neighbors'
  scrubMode: 'off' | 'limited' | 'full'
  writeCssVariables: boolean
}

export type LandingPerformanceBudget = {
  tier: LandingTierId
  maxConcurrentPreloads: number
  maxActiveVideos: number
  scrollFrameBudgetMs: number
  decodeBudgetMs: number
  criticalRevealStallMs: number
  allowPremiumEffects: boolean
}

export type LandingTierPolicies = {
  mediaPolicy: LandingMediaPolicy
  motionPolicy: LandingMotionPolicy
  performanceBudget: LandingPerformanceBudget
}
