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
  videoSrcDesktop = '/landing-media/videos/hero-1080.mp4',
  videoSrcMobile = '/landing-media/videos/hero-720.mp4',
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
  const lastProgressRef = useRef(0)
  const lastActiveRef = useRef(false)

  const [videoSrc, setVideoSrc] = useState(videoSrcDesktop)
  const [progress, setProgress] = useState(0)
  const [isActive, setIsActive] = useState(false)

  const playbackPolicy = useLandingPlaybackPolicy({ forceScrub })
  const prefersReducedMotion = playbackPolicy.prefersReducedMotion
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

      if (Math.abs(scrollProgress - lastProgressRef.current) > 0.001) {
        lastProgressRef.current = scrollProgress
        setProgress(scrollProgress)
      }
      if (nextActive !== lastActiveRef.current) {
        lastActiveRef.current = nextActive
        setIsActive(nextActive)
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

    if (prefersReducedMotion) {
      video.pause()
      return
    }

    video.loop = videoProgressEnd >= 1
    if (isActive) {
      const playPromise = video.play()
      playPromise?.catch(() => undefined)
    } else {
      video.pause()
    }
  }, [isActive, prefersReducedMotion, videoProgressEnd, videoSrc])

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
