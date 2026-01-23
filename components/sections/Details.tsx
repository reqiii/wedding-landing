'use client'

import { useEffect, useState, useRef } from 'react'
import { Glass } from '@/components/ui/Glass'

export function Details() {
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
      id="details"
      className="py-20 px-4 max-w-4xl mx-auto"
    >
      <div
        className={`transition-all duration-[600ms] ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <Glass variant="panel" className="space-y-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl text-dark-gray mb-6">
              Venue & Schedule
            </h2>
            <div className="space-y-4 text-medium-gray">
              <div>
                <h3 className="font-semibold text-dark-gray mb-1">Location</h3>
                <p>Sunset Gardens</p>
                <p>123 Vineyard Lane</p>
                <p>Napa Valley, CA 94558</p>
                <a
                  href="https://maps.google.com/?q=Sunset+Gardens+Napa+Valley"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-light-orange hover:underline mt-2 inline-block"
                >
                  View on Google Maps →
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-display text-2xl text-dark-gray mb-4">Schedule</h3>
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="font-semibold text-dark-gray min-w-[100px]">4:00 PM</div>
                <div className="text-medium-gray">Ceremony Begins</div>
              </div>
              <div className="flex gap-4">
                <div className="font-semibold text-dark-gray min-w-[100px]">4:30 PM</div>
                <div className="text-medium-gray">Cocktail Hour</div>
              </div>
              <div className="flex gap-4">
                <div className="font-semibold text-dark-gray min-w-[100px]">6:00 PM</div>
                <div className="text-medium-gray">Reception & Dinner</div>
              </div>
              <div className="flex gap-4">
                <div className="font-semibold text-dark-gray min-w-[100px]">9:00 PM</div>
                <div className="text-medium-gray">Dancing & Celebration</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-display text-2xl text-dark-gray mb-4">Dress Code</h3>
            <p className="text-medium-gray">
              Cocktail attire. We suggest soft pastels and elegant neutrals to
              complement the sunset theme. Please avoid white.
            </p>
          </div>

          <div>
            <h3 className="font-display text-2xl text-dark-gray mb-4">Gifts</h3>
            <p className="text-medium-gray">
              Your presence is the greatest gift. If you'd like to honor us with
              a gift, we have a registry available. Please contact us for details.
            </p>
          </div>

          <div>
            <h3 className="font-display text-2xl text-dark-gray mb-4">Contact</h3>
            <p className="text-medium-gray">
              Questions? Reach out to our wedding planner:
            </p>
            <p className="text-medium-gray mt-2">
              <strong>Sarah Johnson</strong>
              <br />
              Email: sarah@weddingplanner.com
              <br />
              Phone: (555) 123-4567
            </p>
          </div>
        </Glass>
      </div>
    </section>
  )
}
