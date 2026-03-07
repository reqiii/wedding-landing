'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLandingPlaybackPolicy } from '@/components/homepage/hooks/useLandingPlaybackPolicy'
import {
  createScrollStorySegments,
  type ScrollStorySegment,
} from '@/components/sections/scrollStorySegments'
import { cn } from '@/lib/utils'
import type {
  LandingAssetId,
  LandingSegmentId,
} from '@/lib/landing/mediaManifest'
import type { LandingAssetStateMap } from '@/lib/landing/assetStore'
import { getScrollMetrics, subscribeToScrollMetrics } from '@/components/motion/ScrollScene'

type ScrollStorySceneProps = {
  assets: LandingAssetStateMap
  onInitialMediaReady?: () => void
  onSegmentChange?: (segmentId: LandingSegmentId) => void
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const lerp = (from: number, to: number, t: number) => from + (to - from) * t

export function ScrollStoryScene({
  assets,
  onInitialMediaReady,
  onSegmentChange,
}: ScrollStorySceneProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const scrubRafRef = useRef<number | null>(null)
  const durationRef = useRef(0)
  const isReadyRef = useRef(false)
  const lastProgressRef = useRef(0)
  const lastActiveRef = useRef(false)
  const localProgressRef = useRef(0)
  const isActiveRef = useRef(false)

  const [progress, setProgress] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [videoMode, setVideoMode] = useState<'scrub' | 'loop' | 'hold'>('hold')
  const [previousVideoSrc, setPreviousVideoSrc] = useState<string | null>(null)
  const lastVideoSrcRef = useRef<string | null>(null)
  const hasReportedInitialMediaReadyRef = useRef(false)
  const playbackPolicy = useLandingPlaybackPolicy()
  const reducedMotion = playbackPolicy.prefersReducedMotion
  const canScrub = playbackPolicy.canScrub

  const resolveImageSrc = useCallback(
    (assetId: LandingAssetId) => assets[assetId].resolvedSrc ?? assets[assetId].src,
    [assets]
  )

  const segments = useMemo<ScrollStorySegment[]>(
    () => createScrollStorySegments({ resolveImageSrc }),
    [resolveImageSrc]
  )

  const segmentsWithRange = useMemo(() => {
    const total = segments.reduce((sum, segment) => sum + segment.lengthVh, 0)
    let cursor = 0
    return segments.map((segment) => {
      const start = cursor / total
      cursor += segment.lengthVh
      const end = cursor / total
      return { ...segment, start, end }
    })
  }, [segments])

  const activeSegment = useMemo(() => {
    const found =
      segmentsWithRange.find((segment) => progress >= segment.start && progress <= segment.end) ??
      segmentsWithRange[segmentsWithRange.length - 1]

    const localProgress = clamp((progress - found.start) / (found.end - found.start))

    return { ...found, localProgress }
  }, [progress, segmentsWithRange])

  const activeAsset = activeSegment.assetId ? assets[activeSegment.assetId] : null
  const activeAssetReady = activeAsset?.status === 'ready'
  const resolvedVideoSrc =
    activeAsset && activeAsset.kind === 'video' && activeAssetReady
      ? activeAsset.resolvedSrc ?? activeAsset.src
      : null
  const activePlaybackMode = activeSegment.playbackMode ?? 'hold'

  useEffect(() => {
    if (!resolvedVideoSrc) return
    setVideoSrc(resolvedVideoSrc)
    isReadyRef.current = false
  }, [resolvedVideoSrc])

  useEffect(() => {
    setVideoMode(activePlaybackMode)
    isReadyRef.current = false
  }, [activePlaybackMode])

  useEffect(() => {
    if (!resolvedVideoSrc) return
    setPreviousVideoSrc((current) => {
      if (lastVideoSrcRef.current && lastVideoSrcRef.current !== resolvedVideoSrc) {
        return lastVideoSrcRef.current
      }
      return current ?? resolvedVideoSrc
    })
    lastVideoSrcRef.current = resolvedVideoSrc
  }, [resolvedVideoSrc])

  useEffect(() => {
    onSegmentChange?.(activeSegment.id)
  }, [activeSegment.id, onSegmentChange])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoSrc) return

    const handleLoadedMetadata = () => {
      durationRef.current = Number.isFinite(video.duration) ? video.duration : 0
      isReadyRef.current = true
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    if (video.readyState >= 1) {
      handleLoadedMetadata()
    }

    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata)
  }, [videoSrc])

  useEffect(() => {
    if (hasReportedInitialMediaReadyRef.current || !onInitialMediaReady) return

    const video = videoRef.current
    if (!video || !videoSrc) return

    const handleLoadedData = () => {
      if (hasReportedInitialMediaReadyRef.current) return
      hasReportedInitialMediaReadyRef.current = true
      onInitialMediaReady()
    }

    video.addEventListener('loadeddata', handleLoadedData)

    if (video.readyState >= 2) {
      handleLoadedData()
    }

    return () => video.removeEventListener('loadeddata', handleLoadedData)
  }, [onInitialMediaReady, videoSrc])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoSrc) return

    const shouldLoop = videoMode === 'loop'
    const shouldFreeze = videoMode === 'scrub' && !canScrub

    video.muted = true
    video.playsInline = true
    video.loop = shouldLoop

    if (shouldLoop) {
      const playPromise = video.play()
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => undefined)
      }
    } else {
      video.pause()
    }

    if (!isReadyRef.current || durationRef.current === 0) return

    if (videoMode === 'hold') {
      video.currentTime = Math.max(0, durationRef.current - 0.05)
    } else if (shouldFreeze) {
      video.currentTime = 0
    }
  }, [canScrub, videoMode, videoSrc])

  const scrubTransitionWindow = 0.45

  useEffect(() => {
    const isScrubTransition = activeSegment.kind === 'transition' && activePlaybackMode === 'scrub'
    const scrubProgress = isScrubTransition
      ? clamp((activeSegment.localProgress - scrubTransitionWindow) / (1 - scrubTransitionWindow))
      : activeSegment.localProgress
    localProgressRef.current = scrubProgress
  }, [
    activeSegment.kind,
    activeSegment.localProgress,
    activePlaybackMode,
    scrubTransitionWindow,
  ])

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
    if (!video || !videoSrc) return

    const shouldScrub = videoMode === 'scrub' && canScrub

    if (!shouldScrub) {
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

      const targetTime = clamp(localProgressRef.current) * durationRef.current
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
  }, [canScrub, videoMode, videoSrc])

  const totalHeightVh = useMemo(
    () => segments.reduce((sum, segment) => sum + segment.lengthVh, 0),
    [segments]
  )

  const showVideo =
    Boolean(activeSegment.assetId) && (activeSegment.kind !== 'content' || !activeSegment.backgroundColor)

  const isScrubTransition = activeSegment.kind === 'transition' && activePlaybackMode === 'scrub'
  const transitionProgress = isScrubTransition
    ? clamp(activeSegment.localProgress / scrubTransitionWindow)
    : 1
  const shouldFreezeTransition = isScrubTransition && !canScrub
  const shouldHoldPrevious = Boolean(previousVideoSrc) && Boolean(activeSegment.assetId) && !activeAssetReady
  const showPreviousVideo =
    shouldHoldPrevious ||
    (isScrubTransition &&
      !reducedMotion &&
      Boolean(previousVideoSrc) &&
      (shouldFreezeTransition || transitionProgress < 1))
  const showCurrentVideo = showVideo && Boolean(videoSrc) && activeAssetReady && !shouldFreezeTransition
  const incomingOpacity =
    isScrubTransition && !reducedMotion && canScrub && showPreviousVideo ? transitionProgress : 1
  const incomingBlur = isScrubTransition && !reducedMotion && canScrub ? lerp(12, 0, transitionProgress) : 0
  const outgoingOpacity =
    showPreviousVideo && isScrubTransition && !reducedMotion && canScrub && activeAssetReady
      ? 1 - transitionProgress
      : showPreviousVideo
        ? 1
        : 0
  const outgoingBlur =
    showPreviousVideo && isScrubTransition && !reducedMotion && canScrub
      ? lerp(0, 10, transitionProgress)
      : 0
  const isHeroLogoSegment = activeSegment.id === 'section-1'

  return (
    <section ref={sectionRef} className="relative" style={{ height: `${totalHeightVh}vh` }}>
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{
          opacity: isActive ? 1 : 0,
          visibility: isActive ? 'visible' : 'hidden',
          pointerEvents: isActive ? 'auto' : 'none',
          zIndex: isActive ? 1 : 0,
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: '#000' }}>
          {activeSegment.backgroundColor && (
            <div className={cn('absolute inset-0', activeSegment.backgroundColor)} />
          )}
          {showPreviousVideo && (
            <video
              muted
              playsInline
              preload="auto"
              src={previousVideoSrc ?? undefined}
              autoPlay
              loop
              aria-hidden="true"
              tabIndex={-1}
              className="absolute inset-0 h-full w-full object-cover pointer-events-none"
              style={{
                opacity: outgoingOpacity,
                filter: outgoingBlur ? `blur(${outgoingBlur}px)` : undefined,
                backgroundColor: '#000',
              }}
            />
          )}
          {showCurrentVideo && (
            <video
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              src={videoSrc ?? undefined}
              aria-hidden="true"
              tabIndex={-1}
              className="absolute inset-0 h-full w-full object-cover pointer-events-none"
              style={{
                opacity: incomingOpacity,
                filter: incomingBlur ? `blur(${incomingBlur}px)` : undefined,
                backgroundColor: '#000',
              }}
            />
          )}
          {activeSegment.overlay?.(activeSegment.localProgress)}
        </div>
        <div className={cn('relative z-10 flex h-full', isHeroLogoSegment ? 'items-start' : 'items-center')}>
          <div className="mx-auto w-full max-w-6xl px-4">
            {activeSegment.render?.(activeSegment.localProgress, reducedMotion, { resolveImageSrc })}
          </div>
        </div>
      </div>
    </section>
  )
}
