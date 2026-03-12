# Architecture Rebuild Plan

## Executive Verdict

Current implementation is not production-grade.

The project already contains the right creative direction:

- cinematic media storytelling
- scroll-driven section transitions
- preloader
- premium glass UI

But the current codebase does not implement those ideas on a stable runtime architecture. It mixes multiple scroll systems, false readiness signals, heavy global visual effects, and React-driven hot paths in places that should be imperative and isolated from rendering.

This is not a candidate for incremental polishing. It is a rebuild candidate.

The correct strategy is:

- keep the creative intent
- keep a few low-level primitives
- delete legacy parallel runtimes
- rewrite the landing runtime, media pipeline, preloader contract, and glass system from scratch

## Diagnosis

### Project-Level Diagnosis

The landing currently behaves like a client-only runtime mounted inside a thin Next.js shell. Most critical behavior lives in:

- `components/homepage/HomepageExperience.tsx`
- `components/homepage/LandingRuntimeProvider.tsx`
- `components/sections/ScrollStoryScene.tsx`
- `components/sections/scrollStorySegments.tsx`

That core is undermined by four structural failures:

1. There is more than one runtime architecture in the repo.
2. Readiness and preload semantics are incorrect for video-heavy startup.
3. Hot-path telemetry is wired through React state and context.
4. Route-global styling and effects apply landing cost outside the landing route.

### Subsystem Verdicts

| Area | Verdict | Decision |
| --- | --- | --- |
| Scroll engine | Low-level core is viable | Keep core idea, rewrite integration |
| Video handling | Unstable and reload-heavy | Rewrite from scratch |
| Preloader logic | Semantically wrong | Rewrite from scratch |
| Asset preloading and warmup | Mislabels poster readiness as video readiness | Rewrite from scratch |
| Runtime device capability policy | Late, weak, and biased | Rewrite from scratch |
| Glass effects | Visually on-brand, technically too expensive | Keep idea only |
| React render pressure | Too much context churn in hot paths | Rewrite architecture |
| CSS and layout model | Over-globalized and expensive on mobile | Rewrite landing CSS contract |
| Animation model | Hidden but mounted full-scene composition | Rewrite from scratch |
| Mobile behavior | Fragile and under-tiered | Rewrite from scratch |

## Why Current Approach Fails

### 1. The app has competing runtime models

The active landing uses:

- `components/homepage/HomepageExperience.tsx`
- `components/homepage/LandingRuntimeProvider.tsx`
- `components/sections/ScrollStoryScene.tsx`
- `lib/landing/runtime/scrollEngine.ts`

But the repo still contains a separate older runtime:

- `components/motion/ScrollScene.tsx`
- `components/ScrollScrubVideoSection.tsx`
- `components/ScrollIndicators.tsx`

The landing is therefore not built on one trusted motion/media stack. It is built on one active stack plus legacy overlap. That increases regression risk, duplicates concepts, and encourages future accidental coupling.

### 2. Preloader readiness is false

The startup contract is fundamentally wrong.

Current flow:

- `lib/landing/assetStore.ts` marks critical video as ready when only the poster is ready.
- `components/sections/ScrollStoryScene.tsx` reports initial media ready on the next animation frame, not after first decodable frame.
- `components/homepage/HomepageExperience.tsx` has a fixed timeout fallback that unlocks the scene anyway.

This means the page can become "ready" while:

- the active video is not decodable
- the first frame is not ready
- the user is one scroll away from a black frame or poster flash

For a cinematic landing, this is architectural failure, not a tuning issue.

### 3. React is sitting in the hot path

`components/homepage/LandingRuntimeProvider.tsx` stores:

- FPS
- frame time
- long-task samples
- scroll-frame duration
- video decode lag

inside React state and exposes them through context. That means telemetry updates can propagate through the landing tree. This is especially bad because:

- `requestVideoFrameCallback` feeds decode lag continuously
- scroll measurements report per-frame timing
- glass components consume runtime policy from the same provider
- scene components consume playback policy from the same provider

Production landing runtime should not depend on React commits during scroll and video playback.

### 4. Video handling is reload-heavy and overly stateful

`components/sections/ScrollStoryScene.tsx` resets `video.src` and calls `load()` whenever the active segment changes. Several adjacent segments reuse the same underlying asset, so the same video is reloaded even when no asset change is required.

That causes:

- unnecessary network churn
- unnecessary decode churn
- unnecessary buffering churn
- visible instability at segment boundaries

Additionally, scrubbed transitions run a self-sustaining rAF loop that polls refs continuously even when scroll is idle.

### 5. The scene composition mounts too much UI too early

`components/sections/ScrollStoryScene.tsx` renders all segment content at once and hides most of it with CSS. That keeps heavy UI resident from initial load:

- `components/forms/RSVPForm.tsx`
- countdown timer inside `components/sections/scrollStorySegments.tsx`
- multiple `Glass` panels

This increases:

- hydration cost
- memory usage
- layout and style recalculation surface area
- offscreen React work

The current scroll scene is visually staged, but not architecturally staged.

### 6. The capability policy is late and underpowered

`components/homepage/HomepageExperience.tsx` probes the runtime using a desktop asset up front.

`components/homepage/LandingRuntimeProvider.tsx` starts from a default `midRange` and `desktop` snapshot before async probes complete.

Downgrade logic only pushes toward `midRange`, not a truly safe low-end runtime.

This means weak devices can spend startup time pretending to be stronger than they are, and the system degrades too late.

### 7. Glass and preloader effects are over-budget by default

The current effect stack combines:

- `backdrop-filter`
- SVG displacement filters
- masked shimmer
- blurred pseudo-elements
- `mix-blend-mode`
- multiple stacked translucent layers

Relevant files:

- `components/ui/Glass.tsx`
- `app/globals.css`
- `components/homepage/HomepagePreloader.module.css`
- `components/ui/Input.tsx`
- `components/ui/Select.tsx`

This is acceptable only as an optional upper tier. It is not acceptable as the default contract for mobile or balanced devices.

### 8. Landing overhead leaks globally

`app/layout.tsx` preloads landing media and injects glass SVG filters globally.

`app/globals.css` animates the global body background for the entire app.

This means admin pages inherit landing cost and effect machinery they do not need.

### 9. The data model already shows architectural drift

`components/forms/RSVPForm.tsx` collects a simplified form.

`app/api/rsvp/submit/route.ts` maps transport intent into `message`.

`prisma/schema.prisma` and `app/admin/page.tsx` still model a richer RSVP entity.

This is not a performance issue, but it is clear evidence that the codebase already has concept drift between UI, API, schema, and admin surface.

## Code Smells and Anti-Patterns

### Confirmed in current code

- Multiple scroll/runtime models in one repository
- React state updates in scroll/video telemetry paths
- False readiness signals for startup
- Frequent `video.src` reloads on segment switches
- Self-sustaining scrub rAF loop
- Hidden but mounted heavy segment subtrees
- Offscreen countdown updates
- Expensive layered glass effects
- Nested blur on form controls inside blurred glass panels
- Global landing preloads and SVG filters in root layout
- Legacy streaming API routes parallel to static media delivery
- Fragile fallback logic based on timeout rather than verified readiness

### Consequences

- unstable first impression
- black-frame risk
- poster flash risk
- more React work than necessary during motion
- weak mobile resilience
- elevated GPU cost on devices that should be conservative
- admin route paying for landing-only features

## Hard Decisions

### Delete Completely

These modules should be retired, not refactored:

- `components/ScrollScrubVideoSection.tsx`
- `components/motion/ScrollScene.tsx`
- `app/api/hero-video/route.ts`
- `app/api/hero-main-video/route.ts`
- `app/api/preloader/route.ts`
- `lib/server/landingAssetFiles.ts`

Delete rationale:

- They represent parallel runtime or delivery architectures.
- They are not the correct foundation for the new landing.
- Their continued presence increases confusion and future accidental reuse.

`components/ScrollIndicators.tsx` should also be retired unless rebuilt on top of the new runtime kernel. The current version depends on legacy scroll metrics and is not essential to the cinematic core.

### Rewrite From Scratch

These modules are conceptually useful but code-wise not salvageable:

- `components/homepage/HomepageExperience.tsx`
- `components/homepage/LandingRuntimeProvider.tsx`
- `components/homepage/HomepagePreloader.tsx`
- `components/homepage/HomepagePreloader.module.css`
- `components/homepage/hooks/useLandingAssetStore.ts`
- `components/homepage/hooks/useSegmentWarmup.ts`
- `components/sections/ScrollStoryScene.tsx`
- `components/sections/ScrollStoryScene.module.css`
- `components/sections/scrollStorySegments.tsx`
- `components/ui/Glass.tsx`
- `components/ui/Input.tsx`
- `components/ui/Select.tsx`
- `lib/landing/assetStore.ts`
- `lib/landing/preloadPolicy.ts`
- `lib/landing/runtime/capabilityProfile.ts`
- `app/layout.tsx`
- `app/globals.css`

Rewrite rationale:

- The ideas are valid.
- The current contracts are not.
- Production stability requires new boundaries, not incremental patching.

### Keep As Idea Only

These should survive as art direction, not as code:

- shimmering cinematic preloader
- glass refraction feel
- scroll-driven section takeover
- push-up panel reveals
- video-to-content transitions
- progress indicators as a premium affordance

The rebuild should preserve the emotional effect while replacing the implementation.

### Keep As Foundation

These are the closest things to reusable foundation:

- `lib/landing/runtime/scrollEngine.ts`
- `lib/landing/runtime/sceneRegistry.ts`
- `lib/landing/mediaManifest.ts`
- `next.config.js`
- `app/page.tsx`

Even here, "keep" means:

- preserve the model
- tighten the API
- reduce coupling
- re-integrate into a different architecture

## Files Recommended for Removal or Replacement

| File | Action | Notes |
| --- | --- | --- |
| `components/ScrollScrubVideoSection.tsx` | Delete | Legacy alternate motion and video runtime |
| `components/motion/ScrollScene.tsx` | Delete | Legacy scroll scene system; metrics dependency must move elsewhere |
| `components/ScrollIndicators.tsx` | Replace | Rebuild only if indicators remain in scope |
| `components/homepage/HomepageExperience.tsx` | Rewrite | Current orchestration is timeout-driven and tightly coupled |
| `components/homepage/LandingRuntimeProvider.tsx` | Rewrite | Hot telemetry in React context |
| `components/homepage/HomepagePreloader.tsx` | Rewrite | Wrong readiness contract |
| `components/homepage/HomepagePreloader.module.css` | Rewrite | Over-budget startup visuals |
| `components/homepage/hooks/useLandingAssetStore.ts` | Rewrite | Readiness model is semantically wrong |
| `components/homepage/hooks/useSegmentWarmup.ts` | Rewrite | Needs tier-aware media orchestration |
| `components/sections/ScrollStoryScene.tsx` | Rewrite | Src churn, mounted hidden UI, scrub loop |
| `components/sections/ScrollStoryScene.module.css` | Rewrite | Tied to old composition model and `100vh` assumptions |
| `components/sections/scrollStorySegments.tsx` | Rewrite | Content, media, layout, and timing are over-coupled |
| `components/ui/Glass.tsx` | Rewrite | Too many visual layers by default |
| `components/ui/Input.tsx` | Rewrite | Nested blur inside glass panels |
| `components/ui/Select.tsx` | Rewrite | Nested blur inside glass panels |
| `lib/landing/assetStore.ts` | Rewrite | Poster-ready is not video-ready |
| `lib/landing/preloadPolicy.ts` | Rewrite | Too naive for a strict runtime tier system |
| `lib/landing/runtime/capabilityProfile.ts` | Rewrite | Late probing and weak downgrades |
| `app/layout.tsx` | Rewrite | Landing-only preload/filter logic must be route-scoped |
| `app/globals.css` | Rewrite | Global landing effects should not be global |
| `app/api/hero-video/route.ts` | Delete | Legacy delivery path |
| `app/api/hero-main-video/route.ts` | Delete | Legacy delivery path |
| `app/api/preloader/route.ts` | Delete | Legacy delivery path |
| `lib/server/landingAssetFiles.ts` | Delete | Legacy media route resolver |
| `app/api/rsvp/submit/route.ts` | Replace | Fix schema/UI drift after runtime rebuild |
| `prisma/schema.prisma` | Replace | Align RSVP schema with actual form |
| `app/admin/page.tsx` | Replace | Align admin with actual data model |

## Target Architecture

### Core Principle

The rebuild should separate:

- render-time React UI
- hot-path motion runtime
- media state machine
- startup/readiness contract
- device capability tiering

React should describe panels and content.
Imperative runtime should own scroll, media, timing, and telemetry.

### Target Runtime Shape

#### 1. Route-scoped landing shell

Landing-only assets and effects must move out of root-level global behavior.

Target:

- route-scoped landing layout or landing shell
- admin routes receive none of the landing SVG filters, media preloads, or animated backgrounds
- root `app/layout.tsx` becomes neutral again

#### 2. One runtime kernel

The landing gets exactly one motion engine:

- one scroll subscription
- one measurement pipeline
- one progress writer
- zero alternate scene systems

Keep the CSS-variable approach from `lib/landing/runtime/scrollEngine.ts`, but make the runtime feed:

- active scene
- active segment
- segment progress
- document progress

without React commits on every frame.

#### 3. Media controller with stable video pool

Introduce a dedicated media controller outside React render flow.

Target behavior:

- one active visible video
- optional one standby hidden video on top tier only
- `src` changes only when asset identity changes
- content segment using same asset as transition must reuse decoded media state
- no per-segment blind `load()` calls

Media readiness states must be explicit:

- `poster-ready`
- `metadata-ready`
- `first-frame-ready`
- `playable`
- `failed`

The preloader must only unlock on approved states for the chosen tier.

#### 4. Deterministic capability tiers

Replace the current profile model with strict landing tiers that affect architecture, not just styling.

Recommended tiers:

- `tier-0-poster`: static poster storytelling, no live video
- `tier-1-hold`: video allowed, no scrub, no dual pool, simple transitions
- `tier-2-balanced`: video hold plus limited transition scrubbing, simplified UI effects
- `tier-3-premium`: full cinematic mode with standby media pool and richer polish

Tier must be decided from:

- viewport class
- reduced motion
- save-data
- network quality
- hardware hints
- first-pass decode probe on the actual tier candidate asset

Tier must be conservative by default, then promote only if justified.

#### 5. Segment model split into manifest plus lazy panels

`components/sections/scrollStorySegments.tsx` is currently too monolithic.

Split it into:

- `segmentManifest.ts` for timing, asset mapping, behavior mode
- `segmentPanels/*` for UI panels
- a scene composer that mounts only:
  - active segment
  - previous neighbor
  - next neighbor

Heavy interactive panels like RSVP should mount only near activation.

Countdown should mount only when visible or near-visible.

#### 6. Minimal glass system

Keep the visual language, not the current effect stack.

New default rules:

- one surface layer
- no SVG `filter:url(...)` on default path
- no nested backdrop blur inside form controls
- no "mobile gets even more blur" behavior
- panel glass and form field glass must not stack GPU-heavy blur layers

Premium-only effects can exist behind top-tier gating, but the baseline must already feel premium without expensive filter chains.

#### 7. Landing CSS must be stage-local

Landing-specific CSS should live under landing-scoped files, not global app behavior.

Target rules:

- use `100dvh` or `100svh` where appropriate
- no landing animation on `body`
- no landing-only SVG filters globally injected
- no giant always-running background animation for non-landing routes

## Migration Plan

### Phase 0: Delete and Retire

Goal: remove parallel architectures before building the new one.

Actions:

- delete `components/ScrollScrubVideoSection.tsx`
- delete `components/motion/ScrollScene.tsx`
- delete `app/api/hero-video/route.ts`
- delete `app/api/hero-main-video/route.ts`
- delete `app/api/preloader/route.ts`
- delete `lib/server/landingAssetFiles.ts`
- remove legacy dependencies from `components/ScrollIndicators.tsx` or retire the component
- strip landing media preloads and SVG filter injection from `app/layout.tsx`
- strip route-global animated landing background from `app/globals.css`

Exit criteria:

- only one landing runtime direction remains in the repo
- no legacy media route architecture remains
- admin route no longer pays landing effect overhead

### Phase 1: Architecture Skeleton

Goal: create clean boundaries before reintroducing cinematic behavior.

Build:

- `components/landing/LandingShell.tsx`
- `components/landing/LandingScene.tsx`
- `lib/landing/runtime/runtimeStore.ts`
- `lib/landing/runtime/landingBootstrap.ts`
- `lib/landing/media/mediaController.ts`
- `lib/landing/media/readinessMachine.ts`
- `lib/landing/scene/segmentManifest.ts`

Rules:

- stable config and capability policy in one store
- hot telemetry in a debug-only external store, not React context
- React tree receives coarse state only
- no telemetry-driven rerender contract

Exit criteria:

- startup works with static placeholders
- no React state writes in scroll or decode hot paths
- route-scoped landing shell is isolated from admin

### Phase 2: Motion Engine

Goal: restore scroll storytelling on a safe runtime.

Actions:

- keep the low-level idea of `lib/landing/runtime/scrollEngine.ts`
- upgrade it into the single source of truth for segment progress
- write progress to CSS vars and imperative media controller callbacks
- mount only active segment plus neighbors
- remove idle scrub loops
- only seek video when segment progress meaningfully changes

Rules:

- one scroll subscription
- one frame queue
- no component-level duplicate scroll listeners
- no always-running scrub rAF when scroll is idle

Exit criteria:

- segment transitions are driven by one engine only
- no duplicate scroll metrics systems remain
- hidden heavy UI is no longer fully mounted

### Phase 3: Media Pipeline

Goal: make video delivery stable and deterministic.

Actions:

- keep `lib/landing/mediaManifest.ts` as canonical inventory concept
- rebuild asset loading around explicit readiness states
- create media pool with active and optional standby element
- dedupe asset reuse across adjacent segments
- preload posters, metadata, and first-frame readiness based on tier
- add strict failure paths:
  - poster fallback
  - static panel fallback
  - disable scrub fallback

Rules:

- `video.src` changes only on asset identity changes
- no blind `load()` on every segment switch
- no decode monitoring unless debug mode or adaptive downgrade explicitly needs it

Exit criteria:

- no black frame on first landing reveal
- no asset reload when transition and content share the same media
- weak devices fall back without broken intermediate states

### Phase 4: Preloader and Runtime Tiers

Goal: replace illusion-based startup with a real startup contract.

Actions:

- rebuild preloader around tier-specific unlock criteria
- conservative default tier on first pass
- upgrade tier only after successful capability validation
- disable ambient heavy preloader visuals on anything below top tier
- separate:
  - shell ready
  - critical poster ready
  - first-frame ready
  - interactive ready

Rules:

- no timeout-based "pretend ready" unlocks
- no poster-ready being treated as video-ready
- no desktop asset probe before device tier selection

Exit criteria:

- readiness labels correspond to real runtime state
- startup sequence is deterministic
- tier selection is conservative and explainable

### Phase 5: Glass and UI Integration

Goal: restore premium feel without destructive GPU cost.

Actions:

- rebuild `components/ui/Glass.tsx` to a single-surface default
- remove SVG displacement filters from baseline path
- make premium-only enhancements opt-in and tier-gated
- replace `Input` and `Select` glass stacks with lightweight translucent controls
- ensure RSVP panel mounts only when near active

Rules:

- one blur layer max in default landing panels
- zero nested panel blur plus input blur stacking
- no mobile-specific blur amplification

Exit criteria:

- visual identity remains premium
- GPU-heavy effect stack is no longer structural
- form controls remain legible and cheap to render

### Phase 6: Hardening and QA

Goal: prove that the rebuilt landing is production-grade, not demo-grade.

Required work:

- add performance instrumentation that does not drive React rerenders
- verify startup, scroll, media swap, and fallback behavior on:
  - low-end mobile
  - mid-range Android
  - iPhone Safari
  - modern desktop
- test slow network and save-data modes
- verify no admin route leakage
- align RSVP UI, API, schema, and admin reporting
- define budgets for:
  - startup unlock time
  - long-task frequency
  - scroll-frame duration
  - memory growth across full landing traversal

Exit criteria:

- rebuild survives full device matrix
- no fallback path is visually broken
- no codepath relies on fake readiness
- data model drift is removed

## Acceptance Criteria

The rebuild is only complete when all conditions below are true.

### Runtime and Motion

- There is exactly one landing motion runtime in the codebase.
- Scroll updates do not trigger React state or context updates per frame.
- There is no self-sustaining scrub rAF loop when scroll is idle.
- Hidden segments are not all mounted from initial load.
- Only the active segment and immediate neighbors may stay mounted.

### Media

- `video.src` changes only when asset identity changes.
- Shared media between transition and following content does not reload.
- Preloader unlock requires real tier-approved readiness.
- Poster-only readiness is never mislabeled as first-frame-ready.
- Failure paths degrade cleanly to poster or static mode.

### Device Policy

- Runtime tiering is conservative on first pass.
- Tier selection uses actual target media, not a hard-coded desktop probe.
- Downgrade path can move all the way to safe mode, not only to mid-tier.

### UI and CSS

- Landing-specific media preloads are route-scoped.
- Landing-specific SVG filters are route-scoped or removed.
- Admin routes do not inherit landing background animation or effect stack.
- Default glass path uses at most one blur layer.
- Default landing path does not rely on SVG displacement filters.
- Mobile viewport sizing uses `dvh` or `svh`, not brittle `100vh` assumptions alone.

### Stability and Data Integrity

- RSVP form, API, Prisma schema, and admin dashboard represent the same data model.
- No hidden timer or form component continues unnecessary offscreen work.
- Debug overlays and telemetry tooling are isolated from production render pressure.

## Recommended End-State Summary

Keep:

- the cinematic idea
- the section progression idea
- the media manifest idea
- the low-level CSS-variable scroll engine direction

Destroy and rebuild:

- startup contract
- runtime provider design
- media controller
- scene composition
- glass implementation
- global CSS strategy
- device tier policy

Do not optimize the current implementation into shape.

The correct move is to rebuild the landing around one runtime kernel, one media controller, one readiness contract, and strict route-scoped presentation.
