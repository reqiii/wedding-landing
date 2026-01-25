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
    <ScrollScene innerClassName="relative min-h-[28vh] sm:min-h-[34vh] lg:min-h-[42vh] flex items-center justify-center px-4 py-3 sm:py-5 lg:py-7 overflow-hidden">
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

      <div className="relative z-10 max-w-[70vw] sm:max-w-[55vw] md:max-w-[40vw] lg:max-w-[28vw] mx-auto text-center">
        <Glass variant="hero" className="w-full">
          <div className="flex flex-col items-center gap-2">
            <Image
              src="/api/hero-main-video?asset=logo"
              alt="Логотип"
              width={288}
              height={112}
              sizes="(min-width: 1024px) 140px, (min-width: 640px) 120px, 108px"
              className="h-9 sm:h-10 md:h-12 lg:h-14 w-auto"
              priority
              unoptimized
            />
            <h1 className="font-display text-[0.95rem] sm:text-[1.15rem] md:text-[1.5rem] lg:text-[1.9rem] xl:text-[2.4rem] font-normal text-dark-gray">
              Роман и Анастасия
            </h1>
            <p className="text-[0.6rem] sm:text-[0.7rem] md:text-[0.85rem] text-medium-gray font-light">
              23.07.2026
            </p>
          </div>
        </Glass>
      </div>
    </ScrollScene>
  )
}
