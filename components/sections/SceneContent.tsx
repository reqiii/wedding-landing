'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const lerp = (from: number, to: number, t: number) => from + (to - from) * t

type SceneContentProps = {
  progress: number
  reducedMotion: boolean
  className?: string
  children: ReactNode
}

export function SceneContent({ progress, reducedMotion, className, children }: SceneContentProps) {
  const previousProgressRef = useRef(progress)
  const isScrollingUp = progress < previousProgressRef.current

  useEffect(() => {
    previousProgressRef.current = progress
  }, [progress])

  const motionProgress = isScrollingUp ? 1 - progress : progress

  if (reducedMotion) {
    return (
      <div className={cn('mx-auto w-full max-w-4xl', className)}>
        {children}
      </div>
    )
  }

  const appearStart = 0.55
  const appearEnd = 0.7
  const holdEnd = 0.985
  const exitEnd = 1.0

  const appearProgress = clamp((motionProgress - appearStart) / (appearEnd - appearStart))
  const exitProgress = clamp((motionProgress - holdEnd) / (exitEnd - holdEnd))

  let opacity = 1
  let translateY = lerp(44, 0, appearProgress)

  if (motionProgress >= holdEnd) {
    opacity = 1 - exitProgress
    translateY = lerp(0, -28, exitProgress)
  }

  const isVisible = motionProgress >= appearStart
  const style: CSSProperties = {
    opacity: isVisible ? opacity : 0,
    transform: `translate3d(0, ${translateY}px, 0)`,
    visibility: isVisible ? 'visible' : 'hidden',
  }

  return (
    <div className={cn('mx-auto w-full max-w-4xl', className)} style={style}>
      {children}
    </div>
  )
}
