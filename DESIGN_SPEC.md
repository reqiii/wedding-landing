# Design Specification: Premium Wedding Landing Website

## Visual Identity

### Color Palette

**Primary Palette (Sunset Pastels):**
- **Peach**: `#FFD4B3` (soft, warm)
- **Light Orange**: `#FFB88C` (gentle accent)
- **Warm Sand**: `#F5E6D3` (neutral base)
- **Soft Rose**: `#FFC4D6` (romantic touch)
- **Pale Sky Blue**: `#B8E6E6` (cool accent, used sparingly)
- **Minty Blue**: `#A8D8E8` (secondary cool accent)

**Neutral Palette:**
- **White**: `#FFFFFF` (pure, for contrast)
- **Off-White**: `#FEFCFB` (page background)
- **Light Gray**: `#F5F3F0` (subtle separation)
- **Medium Gray**: `#8B8B8B` (secondary text)
- **Dark Gray**: `#2C2C2C` (primary text)

**Glass Tints:**
- Glass elements use a subtle white/peach tint overlay (10-15% opacity)
- Rim highlights: `rgba(255, 255, 255, 0.3)` on top edge
- Shadow: `rgba(0, 0, 0, 0.1)` with soft blur

### Typography

**Font Stack:**
- **Primary**: Inter (sans-serif) - clean, modern, highly readable
- **Display/Headings**: Playfair Display (serif) - elegant, wedding-appropriate
- **Fallback**: system-ui, -apple-system, sans-serif

**Scale:**
- **Hero Title**: 4rem (64px) desktop / 2.5rem (40px) mobile, Playfair Display, weight 400
- **Section Headings**: 2.5rem (40px) desktop / 2rem (32px) mobile, Playfair Display, weight 400
- **Subheadings**: 1.5rem (24px), Inter, weight 600
- **Body**: 1rem (16px), Inter, weight 400, line-height 1.7
- **Small Text**: 0.875rem (14px), Inter, weight 400
- **CTA Buttons**: 1.125rem (18px), Inter, weight 600

### Spacing System

Based on 8px grid:
- **xs**: 0.5rem (8px)
- **sm**: 1rem (16px)
- **md**: 1.5rem (24px)
- **lg**: 2rem (32px)
- **xl**: 3rem (48px)
- **2xl**: 4rem (64px)
- **3xl**: 6rem (96px)

### Border Radius

- **Small**: 0.5rem (8px) - buttons, small cards
- **Medium**: 1rem (16px) - standard cards, inputs
- **Large**: 1.5rem (24px) - large panels, hero CTAs
- **Pill**: 9999px - pill buttons

## Motion & Animation

### Principles
- **Smooth**: All animations use `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)
- **Subtle**: Never distract from content
- **Respectful**: Honor `prefers-reduced-motion` (disable non-essential animations)

### Transitions

**Micro-interactions:**
- **Hover**: 200ms ease-in-out
- **Press/Tap**: 150ms ease-out
- **Focus**: 200ms ease-in-out with visible ring

**Page Transitions:**
- **Section Reveal**: Fade in + slide up (400ms, delay staggered by 100ms per element)
- **Hero Entrance**: Fade in + subtle scale (600ms)
- **Scroll Parallax**: Very subtle (0.05-0.1x multiplier), only on desktop

**Glass Interactions:**
- **Hover**: Slight brightness increase (5-10%), subtle scale (1.02x)
- **Active**: Slight scale down (0.98x)

### Motion Guidelines
- No auto-playing animations that loop indefinitely
- Parallax only on hero section, very subtle
- Scroll-triggered reveals use Intersection Observer
- Reduce motion on mobile (disable parallax, simpler transitions)

## Glass Component Specification

### Visual Properties

**Base Glass:**
- **Backdrop Blur**: 20px (primary effect)
- **Background**: `rgba(255, 255, 255, 0.15)` overlay
- **Border**: 1px solid `rgba(255, 255, 255, 0.2)`
- **Border Radius**: As per component (8px-24px)
- **Box Shadow**: 
  - Outer: `0 8px 32px rgba(0, 0, 0, 0.1)`
  - Inner (rim highlight): `inset 0 1px 0 rgba(255, 255, 255, 0.3)`

**Refraction Effect:**
- Use SVG `feTurbulence` + `feDisplacementMap` for distortion
- Distortion strength: 2-4px (subtle, not overwhelming)
- Distortion pattern: organic, wave-like
- Apply via CSS filter or inline SVG filter
- Fallback: Enhanced backdrop-filter blur if SVG not supported

**States:**

1. **Default:**
   - Opacity: 100%
   - Brightness: 100%

2. **Hover:**
   - Brightness: 105-110%
   - Scale: 1.02
   - Border highlight: `rgba(255, 255, 255, 0.4)`

3. **Active/Pressed:**
   - Scale: 0.98
   - Brightness: 95%

4. **Focus (keyboard):**
   - Ring: 2px solid `rgba(255, 180, 140, 0.5)`
   - Ring offset: 2px

**Text on Glass:**
- Ensure contrast ratio ≥ 4.5:1 (WCAG AA)
- Use dark text (`#2C2C2C`) on light glass
- Add text shadow if needed: `0 1px 2px rgba(0, 0, 0, 0.1)`

### Glass Variants

1. **Card Glass** (Quick Cards, Info Cards):
   - Padding: 1.5rem
   - Max-width: 400px
   - Standard glass properties

2. **Button Glass** (CTAs):
   - Padding: 0.75rem 1.5rem
   - Smaller blur: 15px
   - Higher opacity overlay: `rgba(255, 255, 255, 0.2)`

3. **Panel Glass** (RSVP Forms, Modals):
   - Padding: 2rem
   - Max-width: 600px
   - Larger blur: 25px
   - Stronger rim highlight

4. **Hero Glass** (Large CTA Container):
   - Padding: 3rem
   - Full-width responsive
   - Maximum blur: 30px
   - Strongest refraction effect

## Layout & Sections

### Hero Section
- **Height**: 100vh (minimum), can extend with content
- **Layout**: Centered content, large glass CTA container
- **Background**: Animated gradient (sunset colors) + subtle texture
- **Content**: Couple names, date, location, primary CTAs
- **Motion**: Fade in on load, subtle parallax on scroll

### Quick Cards Section
- **Layout**: 3-column grid (desktop) / 1-column (mobile)
- **Cards**: Glass cards with icon + title + brief info
- **Spacing**: 2rem gap between cards
- **Motion**: Staggered fade-in on scroll

### Content Sections
- **Max Width**: 1200px, centered
- **Padding**: 3rem vertical, 1.5rem horizontal (mobile: 1rem)
- **Spacing**: 4rem between major sections

### RSVP Section
- **Layout**: Two glass panels side-by-side (desktop) / stacked (mobile)
- **Forms**: Clean, accessible, with clear labels
- **Success State**: Confirmation message, option to edit

### Footer
- **Style**: Minimal, glass-like bar
- **Content**: Copyright, optional social links, admin link (hidden, or behind auth)

## Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

**Mobile Adaptations:**
- Reduce font sizes by ~20%
- Stack all columns
- Reduce glass blur (15px instead of 20-30px)
- Disable parallax
- Simplify animations

## Accessibility Requirements

- **Contrast**: All text meets WCAG AA (4.5:1 minimum)
- **Focus States**: Visible, high-contrast focus rings
- **Keyboard Navigation**: All interactive elements accessible
- **ARIA Labels**: Forms, buttons, sections properly labeled
- **Semantic HTML**: Proper heading hierarchy, landmarks
- **Screen Reader**: Descriptive alt text, aria-live regions for form submissions

## Background & Texture

**Base Background:**
- Layered gradients (sunset pastels)
- Very subtle animated texture (noise or wave pattern)
- Diagonal hairline pattern (optional, 1px lines, 10% opacity) for refraction visibility

**Animation:**
- Slow gradient shift (5-10 minute cycle)
- Texture movement (very subtle, 0.5px/s)
- Respect `prefers-reduced-motion`
