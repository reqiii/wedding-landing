'use client'

import { useEffect, useMemo, useState } from 'react'
import { ScrollScrubVideoSection } from '@/components/ScrollScrubVideoSection'
import { Glass } from '@/components/ui/Glass'
import { SceneContent } from '@/components/sections/SceneContent'

const TARGET_DATE = '2026-07-23T00:00:00'

type CountdownState = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const buildCountdown = (target: Date): CountdownState => {
  const now = new Date()
  const diff = Math.max(0, target.getTime() - now.getTime())
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / (60 * 60 * 24))
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds }
}

export function FinalCountdown() {
  const targetDate = useMemo(() => new Date(TARGET_DATE), [])
  const [countdown, setCountdown] = useState<CountdownState>(() => buildCountdown(targetDate))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = window.setInterval(() => {
      setCountdown(buildCountdown(targetDate))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [targetDate])

  const display = mounted
    ? countdown
    : { days: 0, hours: 0, minutes: 0, seconds: 0 }

  return (
    <ScrollScrubVideoSection
      id="final"
      className="bg-black"
      heightVh={360}
      videoSrcDesktop="/api/hero-video?v=1080"
      videoSrcMobile="/api/hero-video?v=720"
      posterSrc="/api/hero-video?poster=1"
      videoProgressEnd={0.5}
      forceScrub
      showOverlay={false}
    >
      {(progress, reducedMotion) => (
        <SceneContent progress={progress} reducedMotion={reducedMotion}>
          <Glass variant="panel" className="text-center space-y-6">
            <h2 className="font-display text-3xl md:text-4xl text-dark-gray">
              Мы вас ждём
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-dark-gray">
              <Glass variant="card" className="glass-compact text-center">
                <div className="text-3xl font-semibold">{display.days}</div>
                <div className="text-sm text-medium-gray">дней</div>
              </Glass>
              <Glass variant="card" className="glass-compact text-center">
                <div className="text-3xl font-semibold">{display.hours}</div>
                <div className="text-sm text-medium-gray">часов</div>
              </Glass>
              <Glass variant="card" className="glass-compact text-center">
                <div className="text-3xl font-semibold">{display.minutes}</div>
                <div className="text-sm text-medium-gray">минут</div>
              </Glass>
              <Glass variant="card" className="glass-compact text-center">
                <div className="text-3xl font-semibold">{display.seconds}</div>
                <div className="text-sm text-medium-gray">секунд</div>
              </Glass>
            </div>
          </Glass>
        </SceneContent>
      )}
    </ScrollScrubVideoSection>
  )
}
