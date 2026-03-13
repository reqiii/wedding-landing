'use client'

import { RSVPForm } from '@/components/forms/RSVPForm'
import { getCueProps } from '@/components/landing/panels/panelChoreography'
import { LandingSurface } from '@/components/landing/panels/LandingSurface'
import type { LandingPanelRuntimeProps } from '@/components/landing/panels/panelTypes'
import styles from '@/components/landing/panels/RsvpPanel.module.css'

export function RsvpPanel({ segment, tier }: LandingPanelRuntimeProps) {
  return (
    <LandingSurface
      theme={segment.theme}
      tier={tier}
      className={styles.rsvpSurface}
      innerClassName={styles.rsvpInner}
    >
      <div className={styles.rsvpLayout}>
        <div className={styles.header}>
          <div {...getCueProps(segment, 'heading')}>
            <h2 className="font-display text-3xl text-[#1c2331] md:text-4xl">Анкета гостя</h2>
          </div>
          <div {...getCueProps(segment, 'body')}>
            <p className={styles.lead}>
              Информация поможет нам при организации торжества.
              <br />
              Мы будем ждать ответ до 30 июня.
            </p>
          </div>
        </div>
        <RSVPForm
          controlSurface="landing"
          className={styles.form}
          controlClassName={styles.control}
          submitClassName={styles.submitButton}
          successClassName={styles.successState}
          errorClassName={styles.errorState}
        />
      </div>
    </LandingSurface>
  )
}
