'use client'

import type { HTMLAttributes, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLandingPlaybackPolicy } from '@/components/homepage/hooks/useLandingPlaybackPolicy'
import { getScrollMetrics, subscribeToScrollMetrics } from '@/components/motion/ScrollScene'

type ScrollScrubChildren = ReactNode | ((progress: number, reducedMotion: boolean) => ReactNode)

type ScrollScrubVideoSectionProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  children: ScrollScrubChildren
  heightVh?: number
  videoSrcDesktop?: string
  videoSrcMobile?: string
  posterSrc?: string
  videoProgressEnd?: number
  forceScrub?: boolean
  showOverlay?: boolean
  overlayClassName?: string
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function ScrollScrubVideoSection({
  children,
  heightVh = 260,
  className = '',
  videoSrcDesktop = '/api/hero-video?v=1080',
  videoSrcMobile = '/api/hero-video?v=720',
  posterSrc,
  videoProgressEnd = 1,
  forceScrub = false,
  showOverlay = false,
  overlayClassName = 'bg-black/30',
  ...sectionProps
}: ScrollScrubVideoSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const scrubRafRef = useRef<number | null>(null)
  const progressRef = useRef(0)
  const lastProgressRef = useRef(0)
  const lastActiveRef = useRef(false)
  const isActiveRef = useRef(false)
  const durationRef = useRef(0)
  const isReadyRef = useRef(false)

  const [videoSrc, setVideoSrc] = useState(videoSrcDesktop)
  const [progress, setProgress] = useState(0)
  const [isActive, setIsActive] = useState(false)

  const playbackPolicy = useLandingPlaybackPolicy({ forceScrub })
  const prefersReducedMotion = playbackPolicy.prefersReducedMotion
  const allowScrub = playbackPolicy.canScrub
  const resolvedPoster = useMemo(() => posterSrc ?? '', [posterSrc])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const update = () => setVideoSrc(mediaQuery.matches ? videoSrcMobile : videoSrcDesktop)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [videoSrcDesktop, videoSrcMobile])

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
    if (video.readyState >= 1) {
      handleLoadedMetadata()
    }
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata)
  }, [allowScrub, videoSrc])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!allowScrub) {
      video.pause()
      if (isReadyRef.current && durationRef.current > 0) {
        video.currentTime = 0
      }
      return
    }

    video.pause()
  }, [allowScrub, videoSrc])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const section = sectionRef.current
    if (!section) return

    const updateProgress = () => {
      const rect = section.getBoundingClientRect()
      const { viewportH } = getScrollMetrics()
      const vh = viewportH || window.innerHeight
      const startPx = vh * 0.8
      const endPx = vh * 0.2
      const total = Math.max(1, rect.height + (startPx - endPx))
      const progressRaw = (startPx - rect.top) / total
      const scrollProgress = clamp(progressRaw, 0, 1)
      const nextActive = progressRaw >= 0 && progressRaw <= 1
      progressRef.current = scrollProgress

      if (Math.abs(scrollProgress - lastProgressRef.current) > 0.001) {
        lastProgressRef.current = scrollProgress
        setProgress(scrollProgress)
      }
      if (nextActive !== lastActiveRef.current) {
        lastActiveRef.current = nextActive
        isActiveRef.current = nextActive
        setIsActive(nextActive)
      } else {
        isActiveRef.current = nextActive
      }
    }

    const unsubscribe = subscribeToScrollMetrics(() => {
      if (!rafRef.current) {
        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = null
          updateProgress()
        })
      }
    })

    updateProgress()
    return () => {
      unsubscribe()
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!allowScrub) {
      if (scrubRafRef.current) {
        window.cancelAnimationFrame(scrubRafRef.current)
        scrubRafRef.current = null
      }
      return
    }

    let isMounted = true
    const tick = () => {
      if (!isMounted) return
      if (!isActiveRef.current || !isReadyRef.current || durationRef.current === 0) {
        scrubRafRef.current = window.requestAnimationFrame(tick)
        return
      }
      const normalizedVideoProgress = clamp(progressRef.current / videoProgressEnd, 0, 1)
      const targetTime = normalizedVideoProgress * durationRef.current
      if (Math.abs(video.currentTime - targetTime) > 0.02) {
        video.currentTime = targetTime
      }
      scrubRafRef.current = window.requestAnimationFrame(tick)
    }

    scrubRafRef.current = window.requestAnimationFrame(tick)
    return () => {
      isMounted = false
      if (scrubRafRef.current) {
        window.cancelAnimationFrame(scrubRafRef.current)
        scrubRafRef.current = null
      }
    }
  }, [allowScrub, videoProgressEnd])

  return (
    <section
      ref={sectionRef}
      className={`relative ${className}`}
      style={{ height: `${heightVh}vh` }}
      {...sectionProps}
    >
        <div
          className="sticky top-0 h-screen w-full overflow-hidden"
          style={{
            opacity: isActive ? 1 : 0,
            visibility: isActive ? 'visible' : 'hidden',
            pointerEvents: isActive ? 'auto' : 'none',
            zIndex: isActive ? 1 : 0,
          }}
        >
        <div className="absolute inset-0">
          {prefersReducedMotion ? (
            <div
              className="absolute inset-0 bg-center bg-cover"
              style={resolvedPoster ? { backgroundImage: `url(${resolvedPoster})` } : undefined}
            />
          ) : (
            <video
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              poster={resolvedPoster || undefined}
              src={videoSrc}
              aria-hidden="true"
              tabIndex={-1}
              className="absolute inset-0 h-full w-full object-cover pointer-events-none"
            />
          )}
        </div>
        {showOverlay && <div className={`absolute inset-0 z-10 ${overlayClassName}`} />}
        <div className="relative z-20 flex h-full items-center">
          <div className="mx-auto w-full max-w-6xl px-4">
            {typeof children === 'function' ? children(progress, prefersReducedMotion) : children}
          </div>
        </div>
      </div>
    </section>
  )
}
