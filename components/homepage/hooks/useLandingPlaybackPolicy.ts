'use client'

import { useMemo } from 'react'
import { useLandingRuntime } from '@/components/homepage/LandingRuntimeProvider'
import type { LandingDeviceProfile } from '@/lib/landing/mediaManifest'

type UseLandingPlaybackPolicyOptions = {
  forceScrub?: boolean
}

export function useLandingPlaybackPolicy(options: UseLandingPlaybackPolicyOptions = {}) {
  const { forceScrub = false } = options
  const { policy, snapshot, telemetry, debugEnabled, reportScrollFrame, reportVideoDecodeLag } =
    useLandingRuntime()

  const canScrub = useMemo(
    () => (forceScrub ? true : policy.allowVideoScrub),
    [forceScrub, policy.allowVideoScrub]
  )

  const deviceProfile = policy.mediaProfile as LandingDeviceProfile
  const fallbackBehavior = policy.preferPosters ? 'poster' : 'freeze'
  const preferSimpleTransitions =
    !policy.allowDualVideoLayers || !policy.allowVideoBlurTransitions || policy.preferPosters
  const shouldUseBufferedVideoSwap = policy.allowDualVideoLayers

  return {
    deviceProfile,
    capabilityProfile: snapshot.profile,
    policy,
    telemetry,
    debugEnabled,
    prefersReducedMotion: policy.prefersReducedMotion,
    isMobileSafari: policy.isMobileSafari,
    canScrub,
    fallbackBehavior,
    preferSimpleTransitions,
    shouldUseBufferedVideoSwap,
    reportScrollFrame,
    reportVideoDecodeLag,
  }
}
