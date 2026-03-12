'use client'

import { getCueProps } from '@/components/landing/panels/panelChoreography'
import { LandingSurface } from '@/components/landing/panels/LandingSurface'
import type { LandingPanelRuntimeProps } from '@/components/landing/panels/panelTypes'
import { cn } from '@/lib/utils'

export function StoryPanel({ segment, tier }: LandingPanelRuntimeProps) {
  return (
    <LandingSurface theme={segment.theme} tier={tier}>
      <div className="space-y-6 text-center">
        <div {...getCueProps(segment, 'heading')}>
          <h2 className="font-display text-3xl text-dark-gray md:text-4xl">История и приглашение</h2>
        </div>
        <div
          {...getCueProps(segment, 'body')}
          className={cn(
            getCueProps(segment, 'body').className,
            'mx-auto max-w-3xl text-lg leading-relaxed text-medium-gray'
          )}
        >
          <p>
            Мы приглашаем вас разделить с нами день, когда начнется новая глава нашей истории.
            Это будет вечер теплых встреч, искренних улыбок и красивых моментов.
          </p>
          <p>
            Нам важны ваши присутствие и поддержка. Будем счастливы видеть вас рядом в этот
            особенный день.
          </p>
        </div>
      </div>
    </LandingSurface>
  )
}
