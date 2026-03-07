'use client'

import { useEffect, useMemo, useState } from 'react'
import type { LandingDeviceProfile } from '@/lib/landing/mediaManifest'

type UseLandingPlaybackPolicyOptions = {
  forceScrub?: boolean
}

export function useLandingPlaybackPolicy(options: UseLandingPlaybackPolicyOptions = {}) {
  const { forceScrub = false } = options
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isMobileSafari, setIsMobileSafari] = useState(false)
  const [deviceProfile, setDeviceProfile] = useState<LandingDeviceProfile | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const update = () => setDeviceProfile(mediaQuery.matches ? 'mobile' : 'desktop')
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ua = window.navigator.userAgent
    const isIOS = /iP(ad|hone|od)/.test(ua)
    const isWebkit = /WebKit/.test(ua)
    const isCriOS = /CriOS/.test(ua)
    const isFxiOS = /FxiOS/.test(ua)
    setIsMobileSafari(isIOS && isWebkit && !isCriOS && !isFxiOS)
  }, [])

  const canScrub = useMemo(() => {
    if (forceScrub) {
      return true
    }

    // Keep scroll-driven video enabled on mobile when the browser supports it in practice.
    // Reduced motion remains the only hard stop for scrub behavior.
    return !prefersReducedMotion
  }, [forceScrub, prefersReducedMotion])

  const fallbackBehavior = prefersReducedMotion ? 'poster' : isMobileSafari ? 'freeze' : 'none'

  return {
    deviceProfile,
    prefersReducedMotion,
    isMobileSafari,
    canScrub,
    fallbackBehavior,
  }
}
