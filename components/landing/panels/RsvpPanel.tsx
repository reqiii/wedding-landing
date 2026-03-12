'use client'

import { RSVPForm } from '@/components/forms/RSVPForm'
import { getCueProps } from '@/components/landing/panels/panelChoreography'
import { LandingSurface } from '@/components/landing/panels/LandingSurface'
import type { LandingPanelRuntimeProps } from '@/components/landing/panels/panelTypes'

export function RsvpPanel({ segment, tier }: LandingPanelRuntimeProps) {
  return (
    <LandingSurface theme={segment.theme} tier={tier}>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div {...getCueProps(segment, 'heading')}>
            <h2 className="font-display text-3xl text-dark-gray md:text-4xl">Анкета гостя</h2>
          </div>
          <div {...getCueProps(segment, 'body')}>
            <p className="text-lg text-medium-gray">
              Информация поможет нам при организации торжества.
              <br />
              Мы будем ждать ответ до 30 июня.
            </p>
          </div>
        </div>
        <RSVPForm controlSurface="landing" />
      </div>
    </LandingSurface>
  )
}
