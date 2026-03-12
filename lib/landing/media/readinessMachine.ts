import type {
  LandingReadinessState,
  LandingReadyTarget,
} from '@/lib/landing/core/contracts'

const READINESS_RANK: Record<LandingReadinessState, number> = {
  idle: 0,
  'poster-ready': 1,
  'metadata-ready': 2,
  'first-frame-ready': 3,
  playable: 4,
  failed: -1,
}

export function mergeReadinessState(
  current: LandingReadinessState,
  next: LandingReadinessState
): LandingReadinessState {
  if (next === 'failed') {
    return next
  }

  if (current === 'failed') {
    return current
  }

  return READINESS_RANK[next] >= READINESS_RANK[current] ? next : current
}

export function isReadinessSatisfied(
  current: LandingReadinessState,
  target: LandingReadyTarget
) {
  return READINESS_RANK[current] >= READINESS_RANK[target]
}
