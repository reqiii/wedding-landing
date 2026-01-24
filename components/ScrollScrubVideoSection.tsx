'use client'

import type { HTMLAttributes, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface ScrollScrubVideoSectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  heightVh?: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function ScrollScrubVideoSection({
  children,
  heightVh = 260,
  className = '',
  ...sectionProps
}: ScrollScrubVideoSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const progressRef = useRef(0)
  const durationRef = useRef(0)
  const isReadyRef = useRef(false)
  const whiteOverlayRef = useRef<HTMLDivElement | null>(null)

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isMobileSafari, setIsMobileSafari] = useState(false)
  const [videoSrc, setVideoSrc] = useState('/api/hero-video?v=1080')

  const allowScrub = !prefersReducedMotion && !isMobileSafari
  const shouldAutoplay = !prefersReducedMotion && !allowScrub
  const posterSrc = useMemo(() => '/api/hero-video?poster=1', [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const update = () =>
      setVideoSrc(mediaQuery.matches ? '/api/hero-video?v=720' : '/api/hero-video?v=1080')
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ua = window.navigator.userAgent
    const isIOS = /iP(ad|hone|od)/.test(ua)
    const isWebkit = /WebKit/.test(ua)
    const isCriOS = /CriOS/.test(ua)
    const isFxiOS = /FxiOS/.test(ua)
    setIsMobileSafari(isIOS && isWebkit && !isCriOS && !isFxiOS)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      durationRef.current = Number.isFinite(video.duration) ? video.duration : 0
      isReadyRef.current = true
      if (allowScrub) {
        video.pause()
        video.currentTime = 0
      }
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata)
  }, [allowScrub, videoSrc])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!allowScrub) {
      if (shouldAutoplay) {
        video.currentTime = 0
        video.loop = true
        video.muted = true
        video.playsInline = true
        const playPromise = video.play()
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => undefined)
        }
      } else {
        video.pause()
      }
      return
    }

    video.pause()
  }, [allowScrub, shouldAutoplay, videoSrc])

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
      const progressRaw = (startPx - rect.top) / total
      const progress = clamp(progressRaw, 0, 1)
      progressRef.current = progress

      if (whiteOverlayRef.current) {
        let overlayOpacity = 0
        if (progress < 0.1) {
          overlayOpacity = 1 - progress / 0.1
        } else if (progress > 0.9) {
          overlayOpacity = (progress - 0.9) / 0.1
        }
        whiteOverlayRef.current.style.opacity = String(overlayOpacity)
      }

      if (allowScrub && isReadyRef.current && videoRef.current) {
        const targetTime = progress * durationRef.current
        if (Math.abs(videoRef.current.currentTime - targetTime) > 0.02) {
          videoRef.current.currentTime = targetTime
        }
      }
    }

    const updateOnScroll = () => {
      if (!isTicking) {
        isTicking = true
        rafRef.current = window.requestAnimationFrame(() => {
          isTicking = false
          updateProgress()
        })
      }
    }

    updateProgress()
    window.addEventListener('scroll', updateOnScroll, { passive: true })
    window.addEventListener('resize', updateOnScroll)

    return () => {
      window.removeEventListener('scroll', updateOnScroll)
      window.removeEventListener('resize', updateOnScroll)
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [allowScrub])

  return (
    <section
      ref={sectionRef}
      className={`relative ${className}`}
      style={{ height: `${heightVh}vh` }}
      {...sectionProps}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          {prefersReducedMotion ? (
            <div
              className="absolute inset-0 bg-center bg-cover"
              style={{ backgroundImage: `url(${posterSrc})` }}
            />
          ) : (
            <video
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              poster={posterSrc}
              src={videoSrc}
              autoPlay={shouldAutoplay}
              loop={shouldAutoplay}
              aria-hidden="true"
              tabIndex={-1}
              className="absolute inset-0 h-full w-full object-cover pointer-events-none"
            />
          )}
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />
        <div
          ref={whiteOverlayRef}
          className="absolute inset-0 z-20 bg-white pointer-events-none"
          style={{ opacity: 1 }}
        />
        <div className="relative z-30 flex h-full items-center">
          <div className="mx-auto w-full max-w-6xl px-4">{children}</div>
        </div>
      </div>
    </section>
  )
}
