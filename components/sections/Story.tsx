'use client'

import { ScrollScene, SceneReveal } from '@/components/motion/ScrollScene'
import { Glass } from '@/components/ui/Glass'

export function Story() {
  return (
    <ScrollScene
      id="story"
      className="relative"
      innerClassName="py-20 px-4 max-w-4xl mx-auto"
    >
      <Glass variant="panel" className="text-center">
        <SceneReveal start={0.16} duration={0.32}>
          <h2 className="font-display text-3xl md:text-4xl text-dark-gray mb-6">
            Our Story
          </h2>
        </SceneReveal>
        <SceneReveal start={0.28} duration={0.34} className="prose prose-lg max-w-none text-medium-gray space-y-4">
          <p>
            We met on a sunny afternoon in the spring of 2018, and from that
            moment, we knew something special had begun. Over the years, we've
            shared countless adventures, laughter, and dreams.
          </p>
          <p>
            Now, we're excited to celebrate the next chapter of our journey
            together with all of you. Your presence would make our day
            complete.
          </p>
        </SceneReveal>
      </Glass>
    </ScrollScene>
  )
}
