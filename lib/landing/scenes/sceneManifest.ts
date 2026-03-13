import type { LandingSceneManifest } from '@/lib/landing/scenes/sceneTypes'
import { buildTextChoreography } from '@/lib/landing/scenes/sceneChoreography'

const ALL_TIERS = [
  'tier-0-poster',
  'tier-1-hold',
  'tier-2-balanced',
  'tier-3-premium',
] as const

export const LANDING_SCENE_MANIFEST: LandingSceneManifest = {
  id: 'wedding-story',
  segments: [
    {
      id: 'section-1',
      lengthVh: 180,
      media: {
        assetId: 'samet',
        posterAssetId: 'samet',
        mode: 'loop',
      },
      preloadHint: {
        priority: 'critical',
        targetReadiness: 'first-frame-ready',
      },
      warmupHint: {
        when: 'after-critical',
        targets: ['section1'],
      },
      tierCompatibility: [...ALL_TIERS],
      textChoreography: buildTextChoreography(['heading', 'support'], {
        enterStart: 0.02,
        step: 0.12,
        exitStart: 0.82,
        exitStep: 0.04,
        maxEnd: 0.96,
      }),
      panelKey: 'intro',
      theme: 'dark',
      motionPreset: 'hero-lockup',
    },
    {
      id: 'transition-1',
      lengthVh: 35,
      media: {
        assetId: 'section1',
        posterAssetId: 'section1',
        mode: 'scrub',
      },
      preloadHint: {
        priority: 'high',
        targetReadiness: 'metadata-ready',
      },
      warmupHint: {
        when: 'on-enter',
        targets: ['section1'],
      },
      tierCompatibility: [...ALL_TIERS],
      textChoreography: [],
      theme: 'dark',
      motionPreset: 'ambient',
    },
    {
      id: 'section-2',
      lengthVh: 120,
      media: {
        assetId: 'section1',
        posterAssetId: 'section1',
        mode: 'scrub',
      },
      preloadHint: {
        priority: 'critical',
        targetReadiness: 'first-frame-ready',
      },
      warmupHint: {
        when: 'on-enter',
        targets: ['section2'],
      },
      tierCompatibility: [...ALL_TIERS],
      textChoreography: buildTextChoreography(['heading', 'body'], {
        enterStart: 0.12,
        step: 0.08,
        exitStart: 0.74,
        exitStep: 0.06,
      }),
      panelKey: 'story',
      theme: 'soft',
      motionPreset: 'push-up',
    },
    {
      id: 'transition-2',
      lengthVh: 30,
      media: {
        assetId: 'section2',
        posterAssetId: 'section2',
        mode: 'scrub',
      },
      preloadHint: {
        priority: 'high',
        targetReadiness: 'metadata-ready',
      },
      warmupHint: {
        when: 'on-enter',
        targets: ['section2'],
      },
      tierCompatibility: [...ALL_TIERS],
      textChoreography: [],
      theme: 'dark',
      motionPreset: 'ambient',
    },
    {
      id: 'section-3',
      lengthVh: 110,
      media: {
        assetId: 'section2',
        posterAssetId: 'section2',
        mode: 'hold',
      },
      preloadHint: {
        priority: 'high',
        targetReadiness: 'metadata-ready',
      },
      warmupHint: {
        when: 'on-enter',
        targets: ['sun'],
      },
      tierCompatibility: [...ALL_TIERS],
      textChoreography: buildTextChoreography(['heading', 'body', 'support'], {
        enterStart: 0.12,
        step: 0.08,
        exitStart: 0.72,
        exitStep: 0.05,
      }),
      panelKey: 'details',
      theme: 'soft',
      motionPreset: 'info-grid',
    },
    {
      id: 'transition-3',
      lengthVh: 30,
      media: {
        assetId: 'sun',
        posterAssetId: 'sun',
        mode: 'scrub',
      },
      preloadHint: {
        priority: 'high',
        targetReadiness: 'metadata-ready',
      },
      warmupHint: {
        when: 'on-enter',
        targets: ['sun'],
      },
      tierCompatibility: [...ALL_TIERS],
      textChoreography: [],
      theme: 'dark',
      motionPreset: 'ambient',
    },
    {
      id: 'section-4',
      lengthVh: 110,
      media: {
        assetId: 'sun',
        posterAssetId: 'sun',
        mode: 'scrub',
      },
      preloadHint: {
        priority: 'high',
        targetReadiness: 'first-frame-ready',
      },
      warmupHint: {
        when: 'on-enter',
        targets: ['hero'],
      },
      tierCompatibility: [...ALL_TIERS],
      textChoreography: buildTextChoreography(['heading', 'body'], {
        enterStart: 0.12,
        step: 0.08,
        exitStart: 0.76,
        exitStep: 0.04,
      }),
      panelKey: 'location',
      theme: 'soft',
      motionPreset: 'push-up',
    },
    {
      id: 'transition-4',
      lengthVh: 25,
      media: {
        assetId: 'sun',
        posterAssetId: 'sun',
        mode: 'poster',
      },
      preloadHint: {
        priority: 'normal',
        targetReadiness: 'poster-ready',
      },
      warmupHint: {
        when: 'on-enter',
        targets: ['hero'],
      },
      tierCompatibility: [...ALL_TIERS],
      textChoreography: [],
      theme: 'light',
      motionPreset: 'soft-fade',
    },
    {
      id: 'section-5',
      lengthVh: 90,
      media: {
        posterAssetId: 'sun',
        mode: 'poster',
      },
      preloadHint: {
        priority: 'normal',
        targetReadiness: 'poster-ready',
      },
      warmupHint: {
        when: 'on-enter',
        targets: ['hero'],
      },
      tierCompatibility: [...ALL_TIERS],
      textChoreography: buildTextChoreography(['heading', 'body'], {
        enterStart: 0.12,
        step: 0.08,
        exitStart: 0.78,
        exitStep: 0.04,
      }),
      panelKey: 'rsvp',
      theme: 'light',
      motionPreset: 'push-up',
    },
    {
      id: 'transition-5',
      lengthVh: 30,
      media: {
        assetId: 'hero',
        posterAssetId: 'hero',
        mode: 'scrub',
      },
      preloadHint: {
        priority: 'high',
        targetReadiness: 'metadata-ready',
      },
      warmupHint: {
        when: 'on-enter',
        targets: ['hero'],
      },
      tierCompatibility: [...ALL_TIERS],
      textChoreography: [],
      theme: 'dark',
      motionPreset: 'ambient',
    },
    {
      id: 'section-6',
      lengthVh: 110,
      media: {
        assetId: 'hero',
        posterAssetId: 'hero',
        mode: 'hold',
      },
      preloadHint: {
        priority: 'high',
        targetReadiness: 'metadata-ready',
      },
      tierCompatibility: [...ALL_TIERS],
      textChoreography: buildTextChoreography(['heading', 'support'], {
        enterStart: 0.1,
        step: 0.1,
        exitStart: 0.84,
        exitStep: 0.02,
        maxEnd: 0.96,
      }),
      panelKey: 'finale',
      theme: 'dark',
      motionPreset: 'push-up',
    },
  ],
}
