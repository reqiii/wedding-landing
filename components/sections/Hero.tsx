'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ScrollScene } from '@/components/motion/ScrollScene'
import { Glass } from '@/components/ui/Glass'

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

  return (
    <ScrollScene innerClassName="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
      {videoEnabled && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/api/hero-main-video"
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

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <Glass variant="hero" className="w-full">
          <div className="flex flex-col items-center gap-6">
            <Image
              src="/api/hero-video?poster=1"
              alt="Логотип"
              width={160}
              height={64}
              sizes="160px"
              className="h-16 w-auto"
              priority
              unoptimized
            />
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-normal text-dark-gray">
              Роман и Анастасия
            </h1>
            <p className="text-xl md:text-2xl text-medium-gray font-light">
              23.07.2026
            </p>
          </div>
        </Glass>
      </div>
    </ScrollScene>
  )
}
