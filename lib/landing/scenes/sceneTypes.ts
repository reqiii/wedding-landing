import type {
  LandingAssetId,
  LandingMediaMode,
  LandingPanelKey,
  LandingPreloadHint,
  LandingTextCue,
  LandingWarmupHint,
} from '@/lib/landing/core/contracts'
import type { LandingTierId } from '@/lib/landing/tier/tierTypes'

export type LandingSegmentId =
  | 'section-1'
  | 'transition-1'
  | 'section-2'
  | 'transition-2'
  | 'section-3'
  | 'transition-3'
  | 'section-4'
  | 'transition-4'
  | 'section-5'
  | 'transition-5'
  | 'section-6'

export type LandingSceneId = 'wedding-story'

export type LandingSegmentTheme = 'dark' | 'soft' | 'light'

export type LandingSegmentConfig = {
  id: LandingSegmentId
  lengthVh: number
  media: {
    assetId?: LandingAssetId
    posterAssetId?: LandingAssetId
    mode: LandingMediaMode
  }
  preloadHint: LandingPreloadHint
  warmupHint?: LandingWarmupHint
  tierCompatibility: LandingTierId[]
  textChoreography: LandingTextCue[]
  panelKey?: LandingPanelKey
  theme: LandingSegmentTheme
  motionPreset: 'hero-lockup' | 'push-up' | 'info-grid' | 'soft-fade' | 'ambient'
}

export type LandingSceneManifest = {
  id: LandingSceneId
  segments: LandingSegmentConfig[]
}
