'use client'

import React from 'react'
import { useOptionalLandingRuntime } from '@/components/homepage/LandingRuntimeProvider'
import { cn } from '@/lib/utils'

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'card' | 'button' | 'panel' | 'hero'
  children: React.ReactNode
  className?: string
}

export function Glass({ variant = 'card', children, className, ...props }: GlassProps) {
  const runtime = useOptionalLandingRuntime()
  const allowGlassDisplacement = runtime?.policy.allowGlassDisplacement ?? true
  const allowBackdropBlur = runtime?.policy.allowBackdropBlur ?? true

  const variantClasses = {
    card: 'glass-card',
    button: 'glass-button',
    panel: 'glass-panel',
    hero: 'glass-hero',
  }

  return (
    <div
      className={cn(
        'glass-root',
        variantClasses[variant],
        allowGlassDisplacement ? 'glass-effects-on' : 'glass-effects-off',
        allowBackdropBlur ? 'glass-blur-on' : 'glass-blur-off',
        'transition-all duration-200 ease-in-out',
        className
      )}
      {...props}
    >
      <div className="glass-refraction" aria-hidden="true" />
      <div className="glass-refraction-edge" aria-hidden="true" />
      <div className="glass-surface" aria-hidden="true" />
      <div className="glass-content">{children}</div>
    </div>
  )
}
