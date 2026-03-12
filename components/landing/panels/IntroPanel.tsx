'use client'

import Image from 'next/image'
import { getCueProps } from '@/components/landing/panels/panelChoreography'
import type { LandingPanelRuntimeProps } from '@/components/landing/panels/panelTypes'
import { resolveLandingPosterSource } from '@/lib/landing/mediaManifest'
import { cn } from '@/lib/utils'

export function IntroPanel({ segment }: LandingPanelRuntimeProps) {
  return (
    <div className="flex min-h-[70dvh] items-start justify-center pt-[min(8vh,3rem)]">
      <div className="w-full text-center">
        <div {...getCueProps(segment, 'heading')}>
          <Image
            src={resolveLandingPosterSource('logo', 'desktop')}
            alt="Логотип"
            width={500}
            height={197}
            priority
            className="mx-auto h-auto w-[min(92vw,32rem)]"
            unoptimized
          />
        </div>
        <div
          {...getCueProps(segment, 'support')}
          className={cn(
            getCueProps(segment, 'support').className,
            'mx-auto mt-8 max-w-xl text-sm uppercase tracking-[0.32em] text-white/70'
          )}
        >
          performance-first cinematic landing foundation
        </div>
      </div>
    </div>
  )
}
