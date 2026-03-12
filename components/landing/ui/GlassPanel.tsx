'use client'

import type { PropsWithChildren } from 'react'
import styles from '@/components/landing/ui/LandingGlass.module.css'
import type { LandingSegmentTheme } from '@/lib/landing/scenes/sceneTypes'
import type { LandingTierId } from '@/lib/landing/tier/tierTypes'
import { cn } from '@/lib/utils'

type GlassTone = LandingSegmentTheme

type LandingGlassProps = PropsWithChildren<{
  tier: LandingTierId
  tone: GlassTone
  className?: string
  contentClassName?: string
}>

const TIER_CLASS: Record<LandingTierId, string> = {
  'tier-0-poster': styles.tierPoster,
  'tier-1-hold': styles.tierHold,
  'tier-2-balanced': styles.tierBalanced,
  'tier-3-premium': styles.tierPremium,
}

const THEME_CLASS: Record<GlassTone, string> = {
  dark: styles.themeDark,
  soft: styles.themeSoft,
  light: styles.themeLight,
}

export function GlassPanel({
  tier,
  tone,
  className,
  contentClassName,
  children,
}: LandingGlassProps) {
  return (
    <div className={cn(styles.glassRoot, styles.panel, TIER_CLASS[tier], THEME_CLASS[tone], className)}>
      <div className={cn(styles.glassContent, contentClassName)}>{children}</div>
    </div>
  )
}

export function GlassCard({
  tier,
  tone,
  className,
  contentClassName,
  children,
}: LandingGlassProps) {
  return (
    <div className={cn(styles.glassRoot, styles.card, TIER_CLASS[tier], THEME_CLASS[tone], className)}>
      <div className={cn(styles.glassContent, contentClassName)}>{children}</div>
    </div>
  )
}

type GlassOverlayProps = {
  tier: LandingTierId
  allowPremiumEffects: boolean
  className?: string
}

export function GlassOverlay({
  tier,
  allowPremiumEffects,
  className,
}: GlassOverlayProps) {
  return (
    <div
      className={cn(styles.glassRoot, styles.overlay, TIER_CLASS[tier], className)}
      data-premium={allowPremiumEffects ? 'true' : 'false'}
      aria-hidden="true"
    />
  )
}
