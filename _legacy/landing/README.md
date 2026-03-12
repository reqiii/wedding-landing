# Legacy Landing Runtime

These modules are no longer part of the active landing foundation after phase 1.
They were removed from the active codebase during the validation and stabilization pass.

## Removed Runtime Path

- `components/homepage/HomepageExperience.tsx`
- `components/homepage/LandingRuntimeProvider.tsx`
- `components/homepage/HomepagePreloader.tsx`
- `components/homepage/hooks/useLandingAssetStore.ts`
- `components/homepage/hooks/useLandingPlaybackPolicy.ts`
- `components/homepage/hooks/useSegmentWarmup.ts`
- `components/sections/ScrollStoryScene.tsx`
- `components/sections/ScrollStoryScene.module.css`
- `components/sections/scrollStorySegments.tsx`

## Removed Legacy Motion Path

- `components/motion/ScrollScene.tsx`
- `components/ScrollIndicators.tsx`
- `components/ScrollScrubVideoSection.tsx`

## Notes

- The home route now renders `components/landing/LandingShell.tsx`.
- The new active runtime lives under `components/landing` and `lib/landing/{core,runtime,media,scenes,tier}`.
- The old landing runtime has been detached and removed so the new landing shell is the only active architecture.
