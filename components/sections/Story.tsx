'use client'

import { useEffect, useState, useRef } from 'react'
import { Glass } from '@/components/ui/Glass'

export function Story() {
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
      id="story"
      className="py-20 px-4 max-w-4xl mx-auto"
    >
      <div
        className={`transition-all duration-[600ms] ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <Glass variant="panel" className="text-center">
          <h2 className="font-display text-3xl md:text-4xl text-dark-gray mb-6">
            Our Story
          </h2>
          <div className="prose prose-lg max-w-none text-medium-gray space-y-4">
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
          </div>
        </Glass>
      </div>
    </section>
  )
}
