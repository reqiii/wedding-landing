'use client'

import { useEffect, useRef, useState } from 'react'
import { RSVPForm } from '@/components/forms/RSVPForm'
import { Glass } from '@/components/ui/Glass'
import { SceneContent } from '@/components/sections/SceneContent'

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export function RSVP() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [videoSrc, setVideoSrc] = useState('/api/hero-main-video?asset=sun&v=1080')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const update = () =>
      setVideoSrc(
        mediaQuery.matches
          ? '/api/hero-main-video?asset=sun&v=720'
          : '/api/hero-main-video?asset=sun&v=1080'
      )
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoaded = () => {
      if (!Number.isFinite(video.duration)) return
      video.currentTime = Math.max(0, video.duration - 0.05)
      video.pause()
    }

    video.addEventListener('loadedmetadata', handleLoaded)
    if (video.readyState >= 1) {
      handleLoaded()
    }
    return () => video.removeEventListener('loadedmetadata', handleLoaded)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const section = sectionRef.current
    if (!section) return

    let isTicking = false
    const updateProgress = () => {
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight
      const startPx = vh * 0.8
      const endPx = vh * 0.2
      const total = Math.max(1, rect.height + (startPx - endPx))
      const next = clamp((startPx - rect.top) / total)
      setProgress(next)
    }

    const onScroll = () => {
      if (!isTicking) {
        isTicking = true
        rafRef.current = window.requestAnimationFrame(() => {
          isTicking = false
          updateProgress()
        })
      }
    }

    updateProgress()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const fadeOpacity = reducedMotion ? 1 : clamp((progress - 0.08) / 0.6)

  return (
    <section
      ref={sectionRef}
      id="rsvp"
      className="relative"
      style={{ height: '220vh' }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={videoSrc}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          />
        </div>
        <div
          className="absolute inset-0 bg-light-gray"
          style={{ opacity: fadeOpacity }}
        />
        <div className="relative z-10 flex h-full items-center">
          <div className="mx-auto w-full max-w-4xl px-4">
            <SceneContent progress={progress} reducedMotion={reducedMotion}>
              <Glass variant="panel" className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="font-display text-3xl md:text-4xl text-dark-gray">
                    Анкета гостя
                  </h2>
                  <p className="text-medium-gray text-lg">
                    Пожалуйста, заполните данные — все поля обязательны.
                  </p>
                </div>
                <RSVPForm />
              </Glass>
            </SceneContent>
          </div>
        </div>
      </div>
    </section>
  )
}
