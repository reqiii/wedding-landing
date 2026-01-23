'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'card' | 'button' | 'panel' | 'hero'
  children: React.ReactNode
  className?: string
}

export function Glass({ variant = 'card', children, className, ...props }: GlassProps) {
  const [effectsEnabled, setEffectsEnabled] = useState(true)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const connection = (navigator as any).connection
    const saveData = Boolean(connection?.saveData)
    const slowConnection = ['slow-2g', '2g'].includes(connection?.effectiveType)

    const update = () => {
      const reduceMotion = motionQuery.matches
      setEffectsEnabled(!(reduceMotion || saveData || slowConnection))
    }

    update()
    motionQuery.addEventListener('change', update)

    return () => motionQuery.removeEventListener('change', update)
  }, [])

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
        effectsEnabled ? 'glass-effects-on' : 'glass-effects-off',
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
