'use client'

import { useEffect, useState, useRef } from 'react'
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
  const [visible, setVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="quick-info"
      className="py-20 px-4 max-w-6xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={card.title}
            className={`transition-all duration-[600ms] ${
              visible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
            style={{
              transitionDelay: `${index * 100}ms`,
            }}
          >
            <Glass variant="card" className="h-full text-center">
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 className="font-display text-2xl text-dark-gray mb-2">
                {card.title}
              </h3>
              <p className="text-medium-gray">{card.description}</p>
            </Glass>
          </div>
        ))}
      </div>
    </section>
  )
}
