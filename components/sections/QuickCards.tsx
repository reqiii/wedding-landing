'use client'

import { ScrollScrubVideoSection } from '@/components/ScrollScrubVideoSection'
import { LiquidGlass } from '@/components/ui/LiquidGlass'

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
    <ScrollScrubVideoSection className="bg-black" heightVh={260} id="quick-info">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <LiquidGlass
            key={card.title}
            variant="hero"
            className="h-full text-center"
          >
            <div className="mb-4 text-4xl">{card.icon}</div>
            <h3 className="font-display text-2xl text-dark-gray mb-2">{card.title}</h3>
            <p className="text-medium-gray">{card.description}</p>
          </LiquidGlass>
        ))}
      </div>
    </ScrollScrubVideoSection>
  )
}
