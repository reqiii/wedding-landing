'use client'

import { ScrollScene, SceneReveal } from '@/components/motion/ScrollScene'
import { RSVPForm } from '@/components/forms/RSVPForm'
import { DeclineForm } from '@/components/forms/DeclineForm'

export function RSVP() {
  return (
    <ScrollScene
      id="rsvp"
      className="relative"
      innerClassName="py-20 px-4 max-w-6xl mx-auto"
    >
      <div className="text-center mb-12">
        <SceneReveal start={0.18} duration={0.3}>
          <h2 className="font-display text-3xl md:text-4xl text-dark-gray mb-4">
            RSVP
          </h2>
        </SceneReveal>
        <SceneReveal start={0.3} duration={0.3}>
          <p className="text-medium-gray text-lg">
            Please let us know if you'll be joining us
          </p>
        </SceneReveal>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SceneReveal start={0.4} duration={0.32}>
          <RSVPForm />
        </SceneReveal>
        <SceneReveal start={0.46} duration={0.32}>
          <DeclineForm />
        </SceneReveal>
      </div>
    </ScrollScene>
  )
}
