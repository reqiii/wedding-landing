import type {
  LandingReadinessState,
  LandingReadyTarget,
} from '@/lib/landing/core/contracts'

export const READINESS_RANK: Record<LandingReadinessState, number> = {
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

export function compareReadinessState(
  left: LandingReadinessState | LandingReadyTarget,
  right: LandingReadinessState | LandingReadyTarget
) {
  return READINESS_RANK[left] - READINESS_RANK[right]
}

export function isReadinessSatisfied(
  current: LandingReadinessState,
  target: LandingReadyTarget
) {
  return READINESS_RANK[current] >= READINESS_RANK[target]
}

export function minReadinessTarget(
  left: LandingReadyTarget,
  right: LandingReadyTarget
): LandingReadyTarget {
  return READINESS_RANK[left] <= READINESS_RANK[right] ? left : right
}

export function maxReadinessTarget(
  left: LandingReadyTarget,
  right: LandingReadyTarget
): LandingReadyTarget {
  return READINESS_RANK[left] >= READINESS_RANK[right] ? left : right
}

export function resolveHighestReadyState(
  states: readonly LandingReadinessState[]
): LandingReadinessState {
  let highest: LandingReadinessState = 'idle'

  for (let index = 0; index < states.length; index += 1) {
    const state = states[index]
    if (READINESS_RANK[state] > READINESS_RANK[highest]) {
      highest = state
    }
  }

  return highest
}

export function areAssetsReady(
  assetIds: readonly string[],
  readinessMap: Partial<Record<string, LandingReadinessState>>,
  target: LandingReadyTarget
) {
  return assetIds.every((assetId) => isReadinessSatisfied(readinessMap[assetId] ?? 'idle', target))
}
