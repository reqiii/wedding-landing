'use client'

import { ScrollScene, SceneReveal } from '@/components/motion/ScrollScene'
import { Glass } from '@/components/ui/Glass'

interface Card {
  title: string
  description: string
  icon: string
}

const cards: Card[] = [
  {
    title: 'Ceremony',
    description: '4:00 PM - Sunset Gardens',
    icon: '💒',
  },
  {
    title: 'Reception',
    description: '6:00 PM - Grand Ballroom',
    icon: '🎉',
  },
  {
    title: 'Stay',
    description: 'Accommodation recommendations',
    icon: '🏨',
  },
]

export function QuickCards() {
  return (
    <ScrollScene
      id="quick-info"
      className="relative"
      innerClassName="py-20 px-4 max-w-6xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <SceneReveal
            key={card.title}
            start={0.22 + index * 0.08}
            duration={0.3}
            distance={12}
          >
            <Glass variant="card" className="h-full text-center">
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 className="font-display text-2xl text-dark-gray mb-2">
                {card.title}
              </h3>
              <p className="text-medium-gray">{card.description}</p>
            </Glass>
          </SceneReveal>
        ))}
      </div>
    </ScrollScene>
  )
}
