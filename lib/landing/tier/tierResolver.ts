import type { LandingViewportClass } from '@/lib/landing/core/contracts'
import type { LandingTierId, LandingTierSnapshot } from '@/lib/landing/tier/tierTypes'

type NavigatorWithHints = Navigator & {
  connection?: {
    effectiveType?: string
    saveData?: boolean
  }
  deviceMemory?: number
}

function getViewportClass(): LandingViewportClass {
  if (typeof window === 'undefined') {
    return 'desktop'
  }

  return window.matchMedia('(max-width: 900px)').matches ? 'mobile' : 'desktop'
}

function resolveTier(snapshot: Omit<LandingTierSnapshot, 'tier'>): LandingTierId {
  if (
    snapshot.prefersReducedMotion ||
    snapshot.saveData ||
    snapshot.effectiveType === 'slow-2g' ||
    snapshot.effectiveType === '2g'
  ) {
    return 'tier-0-poster'
  }

  if (snapshot.viewportClass === 'mobile') {
    if (
      (snapshot.hardwareConcurrency ?? 0) >= 8 &&
      (snapshot.deviceMemory ?? 0) >= 6 &&
      (snapshot.effectiveType === '4g' || snapshot.effectiveType === null)
    ) {
      return 'tier-2-balanced'
    }

    return 'tier-1-hold'
  }

  if (
    (snapshot.hardwareConcurrency ?? 0) >= 8 &&
    (snapshot.deviceMemory ?? 0) >= 8 &&
    (snapshot.effectiveType === '4g' || snapshot.effectiveType === null)
  ) {
    return 'tier-3-premium'
  }

  if ((snapshot.hardwareConcurrency ?? 0) >= 4) {
    return 'tier-2-balanced'
  }

  return 'tier-1-hold'
}

export async function resolveLandingTierSnapshot(): Promise<LandingTierSnapshot> {
  const viewportClass = getViewportClass()
  const mediaProfile = viewportClass === 'mobile' ? 'mobile' : 'desktop'
  const navigatorRef =
    typeof navigator === 'undefined' ? null : (navigator as NavigatorWithHints)
  const effectiveType = navigatorRef?.connection?.effectiveType ?? null
  const saveData = Boolean(navigatorRef?.connection?.saveData)
  const hardwareConcurrency = navigatorRef?.hardwareConcurrency ?? null
  const deviceMemory = navigatorRef?.deviceMemory ?? null
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let downgradeReason: string | null = null
  if (prefersReducedMotion) {
    downgradeReason = 'reduced-motion'
  } else if (saveData) {
    downgradeReason = 'save-data'
  } else if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    downgradeReason = `network-${effectiveType}`
  }

  const baseSnapshot = {
    viewportClass,
    mediaProfile,
    prefersReducedMotion,
    saveData,
    effectiveType,
    hardwareConcurrency,
    deviceMemory,
    downgradeReason,
  } satisfies Omit<LandingTierSnapshot, 'tier'>

  return {
    ...baseSnapshot,
    tier: resolveTier(baseSnapshot),
  }
}
