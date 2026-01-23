'use client'

import { useEffect, useState } from 'react'
import { ScrollScene, SceneReveal } from '@/components/motion/ScrollScene'
import { Glass } from '@/components/ui/Glass'
import { Button } from '@/components/ui/Button'

export function Hero() {
  const [videoEnabled, setVideoEnabled] = useState(false)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const connection = (navigator as any).connection
    const saveData = Boolean(connection?.saveData)
    const slowConnection = ['slow-2g', '2g'].includes(connection?.effectiveType)

    const updateVideoState = () => {
      const reduceMotion = motionQuery.matches
      setVideoEnabled(!(reduceMotion || saveData || slowConnection))
    }

    updateVideoState()
    motionQuery.addEventListener('change', updateVideoState)

    return () => motionQuery.removeEventListener('change', updateVideoState)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <ScrollScene innerClassName="relative min-h-screen flex items-center justify-center px-4 py-20">
      {videoEnabled && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/api/hero-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          onError={() => setVideoEnabled(false)}
        />
      )}

      <div
        className={`absolute inset-0 bg-gradient-to-br from-off-white via-warm-sand via-peach to-soft-rose ${
          videoEnabled ? 'opacity-40' : 'opacity-80'
        }`}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <Glass variant="hero" className="w-full">
          <SceneReveal start={0.14} duration={0.32}>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-normal text-dark-gray mb-4">
              Our Wedding
            </h1>
          </SceneReveal>

          <SceneReveal start={0.24} duration={0.32} className="space-y-3 mb-8">
            <p className="text-xl md:text-2xl text-medium-gray font-light">
              Saturday, June 15, 2024
            </p>
            <p className="text-lg md:text-xl text-medium-gray">
              Sunset Gardens, Napa Valley
            </p>
          </SceneReveal>

          <SceneReveal
            start={0.36}
            duration={0.34}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              onClick={() => scrollToSection('rsvp')}
              className="w-full sm:w-auto"
            >
              RSVP
            </Button>
            <Button
              variant="solid"
              size="lg"
              onClick={() => scrollToSection('details')}
              className="w-full sm:w-auto"
            >
              Details
            </Button>
            <Button
              variant="solid"
              size="lg"
              onClick={() => scrollToSection('details')}
              className="w-full sm:w-auto"
            >
              How to Get There
            </Button>
          </SceneReveal>
        </Glass>
      </div>
    </ScrollScene>
  )
}
