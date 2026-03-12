import type { LandingAssetId, LandingDeviceProfile } from '@/lib/landing/mediaManifest'

export type { LandingAssetId, LandingDeviceProfile }

export type LandingViewportClass = 'mobile' | 'desktop'

export type LandingMediaMode = 'loop' | 'hold' | 'scrub' | 'poster'

export type LandingReadinessState =
  | 'idle'
  | 'poster-ready'
  | 'metadata-ready'
  | 'first-frame-ready'
  | 'playable'
  | 'failed'

export type LandingReadyTarget = Exclude<LandingReadinessState, 'idle' | 'failed'>

export type LandingPanelKey =
  | 'intro'
  | 'story'
  | 'details'
  | 'location'
  | 'rsvp'
  | 'finale'

export type LandingTextCueChannel = 'eyebrow' | 'heading' | 'body' | 'support'

export type LandingTextCue = {
  id: string
  channel: LandingTextCueChannel
  start: number
  end: number
}

export type LandingPreloadHint = {
  priority: 'critical' | 'high' | 'normal'
  targetReadiness: LandingReadyTarget
}

export type LandingWarmupHint = {
  when: 'boot' | 'after-critical' | 'on-enter'
  targets: LandingAssetId[]
}
