import type { LandingRuntimePolicy } from '@/lib/landing/runtime/capabilityProfile'

export function getGlassEffectClassNames(policy: LandingRuntimePolicy) {
  return {
    effectsClassName: policy.allowGlassDisplacement ? 'glass-effects-on' : 'glass-effects-off',
    blurClassName: policy.allowBackdropBlur ? 'glass-blur-on' : 'glass-blur-off',
  }
}
