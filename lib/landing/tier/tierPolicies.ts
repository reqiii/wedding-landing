import type { LandingTierPolicies, LandingTierSnapshot } from '@/lib/landing/tier/tierTypes'

export function createLandingTierPolicies(
  snapshot: LandingTierSnapshot
): LandingTierPolicies {
  switch (snapshot.tier) {
    case 'tier-0-poster':
      return {
        mediaPolicy: {
          tier: snapshot.tier,
          deviceProfile: snapshot.mediaProfile,
          allowVideo: false,
          allowScrub: false,
          preferPoster: true,
          standbyPoolSize: 0,
          preloadStrategy: 'poster',
          initialReadinessTarget: 'poster-ready',
          warmupStrategy: 'none',
        },
        motionPolicy: {
          tier: snapshot.tier,
          mountStrategy: 'active-only',
          scrubMode: 'off',
          writeCssVariables: true,
        },
        performanceBudget: {
          tier: snapshot.tier,
          maxConcurrentPreloads: 1,
          maxActiveVideos: 0,
          scrollFrameBudgetMs: 10,
          decodeBudgetMs: 0,
          criticalRevealStallMs: 2500,
          allowPremiumEffects: false,
        },
      }
    case 'tier-1-hold':
      return {
        mediaPolicy: {
          tier: snapshot.tier,
          deviceProfile: snapshot.mediaProfile,
          allowVideo: true,
          allowScrub: false,
          preferPoster: false,
          standbyPoolSize: 0,
          preloadStrategy: 'metadata',
          initialReadinessTarget: 'metadata-ready',
          warmupStrategy: 'adjacent',
        },
        motionPolicy: {
          tier: snapshot.tier,
          mountStrategy: 'active-neighbors',
          scrubMode: 'off',
          writeCssVariables: true,
        },
        performanceBudget: {
          tier: snapshot.tier,
          maxConcurrentPreloads: 1,
          maxActiveVideos: 1,
          scrollFrameBudgetMs: 12,
          decodeBudgetMs: 24,
          criticalRevealStallMs: 4000,
          allowPremiumEffects: false,
        },
      }
    case 'tier-2-balanced':
      return {
        mediaPolicy: {
          tier: snapshot.tier,
          deviceProfile: snapshot.mediaProfile,
          allowVideo: true,
          allowScrub: true,
          preferPoster: false,
          standbyPoolSize: 0,
          preloadStrategy: 'first-frame',
          initialReadinessTarget: 'first-frame-ready',
          warmupStrategy: 'adjacent',
        },
        motionPolicy: {
          tier: snapshot.tier,
          mountStrategy: 'active-neighbors',
          scrubMode: 'limited',
          writeCssVariables: true,
        },
        performanceBudget: {
          tier: snapshot.tier,
          maxConcurrentPreloads: 2,
          maxActiveVideos: 1,
          scrollFrameBudgetMs: 14,
          decodeBudgetMs: 20,
          criticalRevealStallMs: 5500,
          allowPremiumEffects: false,
        },
      }
    case 'tier-3-premium':
    default:
      return {
        mediaPolicy: {
          tier: snapshot.tier,
          deviceProfile: snapshot.mediaProfile,
          allowVideo: true,
          allowScrub: true,
          preferPoster: false,
          standbyPoolSize: 1,
          preloadStrategy: 'first-frame',
          initialReadinessTarget: 'first-frame-ready',
          warmupStrategy: 'aggressive',
        },
        motionPolicy: {
          tier: snapshot.tier,
          mountStrategy: 'active-neighbors',
          scrubMode: 'full',
          writeCssVariables: true,
        },
        performanceBudget: {
          tier: snapshot.tier,
          maxConcurrentPreloads: 2,
          maxActiveVideos: 2,
          scrollFrameBudgetMs: 16,
          decodeBudgetMs: 18,
          criticalRevealStallMs: 6500,
          allowPremiumEffects: true,
        },
      }
  }
}
