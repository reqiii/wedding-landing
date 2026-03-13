'use client'

import type { PropsWithChildren } from 'react'
import { GlassPanel } from '@/components/landing/ui/GlassPanel'
import styles from '@/components/landing/panels/LandingSurface.module.css'
import type { LandingSegmentTheme } from '@/lib/landing/scenes/sceneTypes'
import type { LandingTierId } from '@/lib/landing/tier/tierTypes'
import { cn } from '@/lib/utils'

type LandingSurfaceProps = PropsWithChildren<{
  theme: LandingSegmentTheme
  tier: LandingTierId
  className?: string
  innerClassName?: string
}>

const TIER_CLASS: Record<LandingTierId, string> = {
  'tier-0-poster': styles.surfaceTierPoster,
  'tier-1-hold': styles.surfaceTierHold,
  'tier-2-balanced': styles.surfaceTierBalanced,
  'tier-3-premium': styles.surfaceTierPremium,
}

const THEME_CLASS: Record<LandingSegmentTheme, string> = {
  dark: styles.surfaceThemeDark,
  soft: styles.surfaceThemeSoft,
  light: styles.surfaceThemeLight,
}

const CONTENT_THEME_CLASS: Record<LandingSegmentTheme, string> = {
  dark: styles.surfaceThemeDarkContent,
  soft: styles.surfaceThemeSoftContent,
  light: styles.surfaceThemeLightContent,
}

export function LandingSurface({
  theme,
  tier,
  className,
  innerClassName,
  children,
}: LandingSurfaceProps) {
  return (
    <GlassPanel
      tier={tier}
      tone={theme}
      className={cn(styles.surfaceRoot, TIER_CLASS[tier], THEME_CLASS[theme], className)}
      contentClassName={cn(
        'p-[clamp(1.5rem,4vw,3rem)]',
        styles.surfaceContent,
        CONTENT_THEME_CLASS[theme],
        innerClassName
      )}
    >
      {children}
    </GlassPanel>
  )
}
