'use client'

import type { PropsWithChildren } from 'react'
import { GlassPanel } from '@/components/landing/ui/GlassPanel'
import type { LandingSegmentTheme } from '@/lib/landing/scenes/sceneTypes'
import type { LandingTierId } from '@/lib/landing/tier/tierTypes'
import { cn } from '@/lib/utils'

type LandingSurfaceProps = PropsWithChildren<{
  theme: LandingSegmentTheme
  tier: LandingTierId
  className?: string
  innerClassName?: string
}>

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
      className={className}
      contentClassName={cn('p-[clamp(1.5rem,4vw,3rem)]', innerClassName)}
    >
      {children}
    </GlassPanel>
  )
}
