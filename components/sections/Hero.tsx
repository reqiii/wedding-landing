'use client'

import { useEffect, useRef, useState } from 'react'
import { Glass } from '@/components/ui/Glass'
import { Button } from '@/components/ui/Button'

export function Hero() {
  const [isVisible, setIsVisible] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)

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

    // Parallax effect (desktop only, respects reduced motion)
    if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches && window.innerWidth >= 1024) {
      const handleScroll = () => {
        if (heroRef.current) {
          const scrolled = window.pageYOffset
          const parallax = scrolled * 0.1
          heroRef.current.style.transform = `translateY(${parallax}px)`
        }
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => {
        window.removeEventListener('scroll', handleScroll)
        motionQuery.removeEventListener('change', updateVideoState)
      }
    }

    return () => motionQuery.removeEventListener('change', updateVideoState)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section
      ref={heroRef}
      className={`relative min-h-screen flex items-center justify-center px-4 py-20 transition-opacity duration-[600ms] ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Video Background */}
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

      {/* Fallback Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-off-white via-warm-sand via-peach to-soft-rose ${
          videoEnabled ? 'opacity-40' : 'opacity-80'
        }`}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <Glass variant="hero" className="w-full">
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-normal text-dark-gray mb-4 animate-fade-in">
            Our Wedding
          </h1>

          <div className="space-y-3 mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-xl md:text-2xl text-medium-gray font-light">
              Saturday, June 15, 2024
            </p>
            <p className="text-lg md:text-xl text-medium-gray">
              Sunset Gardens, Napa Valley
            </p>
          </div>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
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
          </div>
        </Glass>
      </div>
    </section>
  )
}
