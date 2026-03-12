import type { LandingSegmentConfig } from '@/lib/landing/scenes/sceneTypes'
import type { LandingTierId } from '@/lib/landing/tier/tierTypes'

export type LandingPanelRuntimeProps = {
  segment: LandingSegmentConfig
  tier: LandingTierId
  allowPremiumEffects: boolean
  prefersReducedMotion: boolean
}
