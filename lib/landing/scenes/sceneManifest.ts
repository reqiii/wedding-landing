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
      lengthVh: 100,
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
      textChoreography: buildTextChoreography(['heading']),
      panelKey: 'intro',
      theme: 'dark',
      motionPreset: 'hero-lockup',
    },
    {
      id: 'transition-1',
      lengthVh: 150,
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
      lengthVh: 160,
      media: {
        assetId: 'section1',
        posterAssetId: 'section1',
        mode: 'hold',
      },
      preloadHint: {
        priority: 'critical',
        targetReadiness: 'metadata-ready',
      },
      warmupHint: {
        when: 'on-enter',
        targets: ['section2'],
      },
      tierCompatibility: [...ALL_TIERS],
      textChoreography: buildTextChoreography(['heading', 'body']),
      panelKey: 'story',
      theme: 'soft',
      motionPreset: 'push-up',
    },
    {
      id: 'transition-2',
      lengthVh: 150,
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
      lengthVh: 170,
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
      textChoreography: buildTextChoreography(['heading', 'body', 'support']),
      panelKey: 'details',
      theme: 'soft',
      motionPreset: 'info-grid',
    },
    {
      id: 'transition-3',
      lengthVh: 150,
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
      lengthVh: 160,
      media: {
        assetId: 'sun',
        posterAssetId: 'sun',
        mode: 'hold',
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
      textChoreography: buildTextChoreography(['heading', 'body']),
      panelKey: 'location',
      theme: 'soft',
      motionPreset: 'push-up',
    },
    {
      id: 'transition-4',
      lengthVh: 110,
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
      lengthVh: 170,
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
      textChoreography: buildTextChoreography(['heading', 'body']),
      panelKey: 'rsvp',
      theme: 'light',
      motionPreset: 'push-up',
    },
    {
      id: 'transition-5',
      lengthVh: 150,
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
      lengthVh: 160,
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
      textChoreography: buildTextChoreography(['heading', 'support']),
      panelKey: 'finale',
      theme: 'dark',
      motionPreset: 'push-up',
    },
  ],
}
