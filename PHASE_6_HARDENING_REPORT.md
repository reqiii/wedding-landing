# Phase 6 Hardening Report

## Summary

Phase 6 hardened the existing landing runtime without changing the core ownership model:

- `motionSystem.ts` remains the only animation driver.
- `mediaController.ts` remains the only media owner.
- `runtimeStore.ts` remains coarse-grained.
- React still stays outside per-frame animation and decode hot paths.

The work focused on instrumentation, frame-cost reduction, fallback hardening, DOM/CSS cost control, validation, and cleanup of obsolete landing delivery paths.

## Performance Findings

### 1. Coarse store updates were broader than necessary

`LandingStage.tsx` subscribed to the entire `media` branch, and the store recreated nested branches on every patch. That made coarse consumers more sensitive to unrelated updates than intended.

Remediation:

- narrowed `LandingStage.tsx` subscriptions to the specific media fields it actually consumes
- updated `runtimeStore.ts` to preserve nested branch references when a branch did not change

### 2. Frame-loop work still needed measurement, not just budgets on paper

Telemetry helpers already existed, but they were not wired into the live runtime. That meant frame budgets, decode budgets, and long-task thresholds were declared in policy but not observed.

Remediation:

- wired `scrollFrameMonitor.ts`, `fpsMonitor.ts`, `longTaskMonitor.ts`, and `videoDecodeMonitor.ts` into the runtime
- added coarse telemetry summaries under runtime debug state for motion, media, startup, and long-task metrics

### 3. Poster tier was not actually zero-video

`tierPolicies.ts` declared `maxActiveVideos: 0` for `tier-0-poster`, but `mediaPool.ts` still clamped the pool to at least one plane.

Remediation:

- `mediaPool.ts` now allows a true zero-plane poster runtime

### 4. Reveal fallback logic was vulnerable to recursive patch pressure

During Phase 6 validation, an automated production-page check surfaced repeated `RangeError: Maximum call stack size exceeded` failures in the reveal path, with the shell remaining in `critical-loading`.

Remediation:

- reveal reconciliation in `revealController.ts` now schedules through a microtask boundary instead of recursively patching during synchronous store emission
- startup timing capture was retained, but moved away from recursive store-patch patterns

### 5. Visual cost remained concentrated in stage-wide layers and blur surfaces

The landing runtime was already better than the old stack, but still kept several full-screen layers and generous `will-change` hints alive across tiers.

Remediation:

- reduced always-on `will-change` usage
- lowered blur intensity for balanced and premium glass tiers
- suppressed the stage overlay and control rail on lower tiers
- reduced preloader blur cost

## Optimizations Applied

### Runtime and telemetry

- Added startup timing telemetry for initialize, tier resolution, reveal readiness, and final reveal.
- Added motion telemetry for frame samples, average/max frame cost, low-FPS sampling, and over-budget frames.
- Added media telemetry for seek counts, decode lag, fallback counts, and active/total plane counts.
- Added long-task telemetry without routing that data through React.

### Motion and frame budget

- Cached document scroll span on layout invalidation instead of re-reading document height every frame.
- Kept CSS variable writes epsilon-gated and limited to the active/near-active segment window.
- Preserved nested store references to reduce selector churn in coarse consumers.

### Media and fallback behavior

- Enabled true poster-only tier behavior with no forced video plane.
- Added explicit downgrade reasons for autoplay failures, seek failures, decode-lag fallback, active-plane allocation failures, and active media errors.
- Switched reveal stall thresholds to tier-aware budgets.
- Paused reveal stall timers while the document is hidden and resumed them on visibility return.

### DOM and CSS

- Narrowed `LandingStage.tsx` subscriptions and added boundary-level DOM residency telemetry.
- Disabled stage overlay and control rail on lower tiers.
- Reduced persistent layer-promotion hints.
- Lowered blur intensity for `tier-2-balanced`, `tier-3-premium`, and the preloader.

### Bundle and codepath cleanup

- Deleted legacy route handlers:
  - `app/api/hero-video/route.ts`
  - `app/api/hero-main-video/route.ts`
  - `app/api/preloader/route.ts`
- Deleted the unused route resolver:
  - `lib/server/landingAssetFiles.ts`
- Confirmed the production build no longer emits those obsolete API routes.
- Realigned `eslint-config-next` with the current Next major in `package.json`.

## Validation Notes

## Production checks completed

- `npm run lint` passes with no ESLint errors.
- `npx next build` completes successfully after the Phase 6 changes.
- Local production HTTP smoke checks return `200` for:
  - `/`
  - `/admin`
  - `/landing-media/logo/logo.svg`
- Build output confirms the legacy landing API routes are gone from the app route table.

## Browser/runtime findings captured during Phase 6

- An automated browser validation pass on the production build exposed recursive reveal-store patching that could overflow the stack and block reveal progression.
- That issue was fixed in `revealController.ts` by moving reconciliation out of synchronous nested patch recursion.
- A media-failure validation scenario confirmed that poster fallback can be entered under video request failure conditions.

## Validation limitations

- Full real-device verification was not possible from this environment.
- iPhone Safari, low-end Android GPU behavior, and long-session memory trends still need manual device coverage.
- The temporary browser harness used during the audit was not kept in the repo.

## Device Compatibility Notes

- Desktop-class environments still resolve to `tier-3-premium` when hardware and network hints support it.
- Narrow/mobile environments still degrade to `tier-2-balanced` or `tier-1-hold` based on hardware and connection hints.
- Reduced motion and save-data remain conservative and route directly to `tier-0-poster`.
- Lower tiers now avoid unnecessary stage-wide decorative layers and video-plane allocation.

## Remaining Technical Debt

- The local workstation still reports an `@next/swc` version mismatch warning during `next build` even though the production build succeeds.
- `npm run build` may intermittently fail on this Windows machine because `prisma generate` can hit a locked `node_modules/.prisma/client/query_engine-windows.dll.node`; rerunning `next build` after generation works reliably.
- `package.json` still uses `next lint`, which Next marks as deprecated for future major versions.
- Real-device validation for Safari/iOS decode behavior, Android compositor cost, and long-session memory stability still needs a manual matrix outside this environment.
