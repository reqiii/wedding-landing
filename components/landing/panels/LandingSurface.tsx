'use client'

import type { PropsWithChildren } from 'react'
import styles from '@/components/landing/LandingShell.module.css'
import type { LandingSegmentTheme } from '@/lib/landing/scenes/sceneTypes'
import { cn } from '@/lib/utils'

type LandingSurfaceProps = PropsWithChildren<{
  theme: LandingSegmentTheme
  className?: string
}>

const THEME_CLASS: Record<LandingSegmentTheme, string> = {
  dark: styles.surfaceDark,
  soft: styles.surfaceSoft,
  light: styles.surfaceLight,
}

export function LandingSurface({
  theme,
  className,
  children,
}: LandingSurfaceProps) {
  return (
    <div className={cn(styles.surface, THEME_CLASS[theme], className)}>
      <div className={styles.surfaceInner}>{children}</div>
    </div>
  )
}
