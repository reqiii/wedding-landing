# Landing Page Choreography Validation Report
**Date:** 2026-03-13  
**Test Environment:** http://localhost:3000 (Next.js 15.5.11 dev server)  
**Browser:** Puppeteer (Headless Chromium)  
**Viewport:** 1920x1080

## Executive Summary

Tested 5 choreography scenarios on the live landing page. All scenarios FAILED due to a persistent empty glass shell issue and one instance of content flickering during reverse scroll.

### Overall Results
- **Total Scenarios:** 5
- **Passed:** 0
- **Failed:** 5

---

## Scenario Results

### 1) Hero → Story Transition
**Status:** ❌ FAIL  
**Scroll Position:** 1080px (1 viewport down)

**Issues Detected:**
- ✗ 1 empty glass shell detected: `LandingShell_panelStack__ELxhU` (position 300-1056, 756px height)

**Observations:**
- Content properly displays Story panel boilerplate text (46 chars)
- No hero overlay persistence issues
- Panels properly synchronized with content
- Smooth transition observed

**Content Visible:** "performance-first cinematic landing foundation"

---

### 2) Story → Event Transition  
**Status:** ❌ FAIL  
**Scroll Position:** 2160px (2 viewports down)

**Issues Detected:**
- ✗ 1 empty glass shell detected: `LandingShell_panelStack__ELxhU` (same position, persistent)

**Observations:**
- Story panel content properly visible (267 chars): "История и приглашение..."
- Event panel transitioning in view
- One panel at opacity 0.00 (expected during transition)
- Content hierarchy appears correct

**Visible Content Panels:**
- Panel with 313 chars (mixed content)
- Panel with 267 chars (Story: "История и приглашениеМы приглашаем вас разделить с...")
- Multiple DOM hierarchy layers showing same content (expected React rendering)

---

### 3) Reverse Scroll: Event → Story
**Status:** ❌ FAIL  
**Scroll Position:** 1080px (after scrolling back)

**Issues Detected:**
- ✗ 1 empty glass shell detected: `LandingShell_panelStack__ELxhU` (persistent)
- ✗ 1 content panel present but hidden (opacity: 0.00) - **possible flicker/reappear issue**

**Observations:**
- Reverse scrolling triggers a content panel to be hidden while still in viewport
- `LandingShell_panelMotion__s41vA` at position 433-720 has content (267 chars) but opacity 0.00
- This indicates the panel may disappear/reappear during the transition
- Story content still readable through other DOM layers

**Critical Finding:** This scenario shows the classic "panel flicker" pattern where outgoing content doesn't fully clear before incoming content appears.

---

### 4) Fast-Scroll Forward: Hero → Story → Event
**Status:** ❌ FAIL  
**Scroll Position:** 2700px (2.5 viewports, rapid scroll)

**Issues Detected:**
- ✗ 1 empty glass shell detected: `LandingShell_panelStack__ELxhU` (persistent)

**Observations:**
- Fast scrolling handled reasonably well
- Story panel content visible (267 chars)
- No intermediate empty states or unreadable content
- Content synchronization maintained during rapid movement
- No duplicate visible distinct content panels

**Positive:** Despite fast scrolling, content remains readable and no empty shells appeared *during* the transition (only the persistent one).

---

### 5) Fast-Scroll Reverse: Event → Story → Hero  
**Status:** ❌ FAIL  
**Scroll Position:** 0px (back to top)

**Issues Detected:**
- ✗ 1 empty glass shell detected: `LandingShell_panelStack__ELxhU` (persistent)

**Observations:**
- Fast reverse scroll returns to Hero panel successfully
- Content shows boilerplate text (46 chars): "performance-first cinematic landing foundation"
- No content overlap or flicker during fast movement
- Clean return to initial state

**Positive:** Reverse fast-scrolling is cleaner than slow reverse scroll (no hidden content panels detected).

---

## Technical Analysis

### Empty Glass Shell Issue (Critical)

**Element:** `LandingShell_panelStack__ELxhU`  
**Position:** Fixed at top:300px, height:756px  
**Characteristics:**
- Always visible in viewport (300-1056px range)
- Opacity: 1.00 (fully opaque)
- Content: 0 characters (completely empty)
- Present in ALL 5 scenarios

**Impact:** This creates a persistent empty visual element that occupies significant screen space (756px height, ~70% of viewport height). While it doesn't block content (likely due to CSS layering/z-index), it represents a shell/content synchronization failure.

**Root Cause (Likely):** This appears to be a "next panel" placeholder or preloader that's being rendered but never populated with content. The positioning suggests it's attempting to prepare the upcoming panel but failing to mount content.

---

### Content Panel Flicker (Reverse Scroll)

**Scenario:** Reverse scroll Event → Story only  
**Element:** `LandingShell_panelMotion__s41vA`  
**Behavior:** Panel present in DOM with content (267 chars) but opacity set to 0.00

**Impact:** During reverse scrolling, a content panel that should be visible is instead hidden, creating a potential flicker effect where:
1. Panel exists with content
2. Panel is rendered but invisible (opacity: 0)
3. Same content is visible through other DOM layers

This indicates the panel lifecycle isn't properly synchronized during reverse transitions.

---

### Console Errors

**Hero → Story scenario only:**
- `Failed to load resource: the server responded with a status of 404 (Not Found)`
- Likely a missing asset (image, video, or font)
- Does not appear to affect core choreography
- Filtered from other scenarios (may have been cached)

---

## Validation Criteria Assessment

### ✓ Hero/Logo Overlay Exit
**PASS** - No hero overlay detected persisting while Story content is readable

### ✗ Shell and Inner Content Synchronization
**FAIL** - Empty glass shell (`panelStack`) present in all scenarios without synchronized content

### ✗ Panel Disappear/Reappear During Forward Transition
**PARTIAL FAIL** - Issue detected in **reverse** scroll only (not forward)  
Content panel present but hidden during Event → Story reverse transition

### ✓ Outgoing Content Clears Before Incoming Content Dominates
**PASS** - No overlapping distinct content panels during normal transitions  
Exception: One hidden panel during reverse scroll (see above)

### ✓ Fast Scroll - No Empty Glass Shells
**PARTIAL PASS** - No *additional* empty shells created during fast scroll  
But: The persistent empty `panelStack` is always present

### ✓ Fast Scroll - No Unreadable Content
**PASS** - All visible content maintains opacity > 0.5 or is at 1.0 during fast scrolling

---

## Recommendations

### Priority 1: Fix Empty Glass Shell
**File:** Likely in `components/landing/LandingShell.tsx` or related shell component  
**Element:** `LandingShell_panelStack__ELxhU` (second stack instance)

**Investigation needed:**
1. Why is a second `panelStack` being rendered at position 300-1056?
2. Is this a "next panel" preloader that's failing to mount content?
3. Check if this element should be hidden when empty or removed from DOM

**Suggested fix:**
```jsx
// Add conditional rendering or CSS to hide when no content
{hasContent && <div className={styles.panelStack}>...</div>}
```

### Priority 2: Fix Reverse Scroll Flicker
**File:** Panel motion/transition logic  
**Element:** `LandingShell_panelMotion__s41vA`

**Issue:** During reverse scroll (Event → Story), panel content is rendered but opacity is set to 0, while the same content is visible through other layers.

**Investigation needed:**
1. Check opacity transition timing for reverse scroll
2. Verify panel lifecycle hooks for backward navigation
3. Ensure content doesn't persist with opacity:0 when it should be unmounted

### Priority 3: Fix 404 Resource Error
**Scenario:** Hero → Story transition  
**Action:** Check browser network panel to identify missing resource  
**Likely culprit:** Image, video thumbnail, or web font

---

## Positive Findings

1. ✅ **No hero overlay persistence** - Hero exits cleanly before Story becomes readable
2. ✅ **Fast scrolling stability** - Both forward and reverse fast scrolling maintain readable content
3. ✅ **Content hierarchy** - No overlapping distinct content panels during normal transitions
4. ✅ **No empty shells created by transitions** - The empty shell is persistent, not generated by scrolling

---

## Test Methodology

**Tool:** Puppeteer (automated browser testing)  
**Approach:**
- Load page, wait for network idle
- For each scenario:
  - Position scroll to starting point
  - Execute scroll transition (smooth or instant as specified)
  - Wait 1-2 seconds for choreography to complete
  - Capture DOM state, panel positions, opacities, and content

**Validation Logic:**
- Filter infrastructure containers (sceneRoot, panelLayer) from content checks
- Identify "real" content panels (>50 chars, not boilerplate)
- Flag empty shells with size >200px, opacity >0.5, and no content
- Detect hidden content panels (opacity=0 with content present)
- Check for overlapping distinct content (multiple visible panels with different text)

---

## Conclusion

The landing page choreography is **mostly functional** but has **two critical issues**:

1. **Persistent empty glass shell** affecting all transitions
2. **Content flicker** during reverse scroll transitions

The empty glass shell is the most critical issue as it affects 100% of scenarios and represents a fundamental shell/content synchronization problem. The reverse scroll flicker is secondary but still impacts user experience when navigating backward through the site.

**Recommendation:** Address the empty `panelStack` element before considering the choreography validated for production.
