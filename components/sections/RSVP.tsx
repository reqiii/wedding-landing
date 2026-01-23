'use client'

import { useEffect, useState, useRef } from 'react'
import { RSVPForm } from '@/components/forms/RSVPForm'
import { DeclineForm } from '@/components/forms/DeclineForm'

export function RSVP() {
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
      id="rsvp"
      className="py-20 px-4 max-w-6xl mx-auto"
    >
      <div
        className={`transition-all duration-[600ms] ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-dark-gray mb-4">
            RSVP
          </h2>
          <p className="text-medium-gray text-lg">
            Please let us know if you'll be joining us
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RSVPForm />
          <DeclineForm />
        </div>
      </div>
    </section>
  )
}
