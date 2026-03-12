'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLandingPlaybackPolicy } from '@/components/homepage/hooks/useLandingPlaybackPolicy'
import {
  createScrollStorySegments,
  type ScrollStorySegment,
} from '@/components/sections/scrollStorySegments'
import styles from '@/components/sections/ScrollStoryScene.module.css'
import type { LandingAssetStateMap } from '@/lib/landing/assetStore'
import type { LandingAssetId, LandingSegmentId } from '@/lib/landing/mediaManifest'
import { createScrollEngine } from '@/lib/landing/runtime/scrollEngine'
import { clamp } from '@/lib/landing/runtime/progressMath'
import { observeVideoDecodeLag } from '@/lib/landing/telemetry/videoDecodeMonitor'
import { cn } from '@/lib/utils'

type ScrollStorySceneProps = {
  assets: LandingAssetStateMap
  onInitialMediaReady?: () => void
  onSegmentChange?: (segmentId: LandingSegmentId) => void
}

export function ScrollStoryScene({
  assets,
  onInitialMediaReady,
  onSegmentChange,
}: ScrollStorySceneProps) {
  const playbackPolicy = useLandingPlaybackPolicy()
  const reducedMotion = playbackPolicy.prefersReducedMotion
  const policy = playbackPolicy.policy
  const sceneId = useId()
  const sectionRef = useRef<HTMLElement | null>(null)
  const activeVideoRef = useRef<HTMLVideoElement | null>(null)
  const prewarmVideoRef = useRef<HTMLVideoElement | null>(null)
  const hasReportedInitialMediaReadyRef = useRef(false)
  const scrubRafRef = useRef<number | null>(null)
  const segmentProgressRef = useRef<Record<LandingSegmentId, number>>({} as Record<LandingSegmentId, number>)
  const isSceneActiveRef = useRef(false)
  const activeSegmentIdRef = useRef<LandingSegmentId>('section-1')
  const timedTransitionStartRef = useRef<LandingSegmentId | null>(null)
  const engineRef = useRef(
    createScrollEngine<LandingSegmentId>({
      onScrollFrame: playbackPolicy.reportScrollFrame,
    })
  )
  const [activeSegmentId, setActiveSegmentId] = useState<LandingSegmentId>('section-1')
  const [videoReady, setVideoReady] = useState(false)

  const resolveImageSrc = useCallback((assetId: LandingAssetId) => assets[assetId].src, [assets])

  const segments = useMemo<ScrollStorySegment[]>(
    () => createScrollStorySegments({ resolveImageSrc }),
    [resolveImageSrc]
  )
  const totalHeightVh = useMemo(
    () => segments.reduce((sum, segment) => sum + segment.lengthVh, 0),
    [segments]
  )
  const activeSegment = useMemo(
    () => segments.find((segment) => segment.id === activeSegmentId) ?? segments[0],
    [activeSegmentId, segments]
  )
  const activeSegmentIndex = useMemo(
    () => segments.findIndex((segment) => segment.id === activeSegmentId),
    [activeSegmentId, segments]
  )
  const nextVideoAsset = useMemo(() => {
    for (let index = activeSegmentIndex + 1; index < segments.length; index += 1) {
      const candidate = segments[index]
      if (!candidate.assetId || assets[candidate.assetId].kind !== 'video' || candidate.backgroundColor) {
        continue
      }
      if (candidate.assetId === activeSegment.assetId) continue
      return assets[candidate.assetId]
    }
    return null
  }, [activeSegment.assetId, activeSegmentIndex, assets, segments])

  const activeAsset =
    activeSegment.assetId && activeSegment.backgroundColor ? null : activeSegment.assetId ? assets[activeSegment.assetId] : null
  const shouldShowPosterFallback = Boolean(activeAsset?.posterSrc) && (policy.preferPosters || !videoReady)

  useEffect(() => {
    activeSegmentIdRef.current = activeSegment.id
    onSegmentChange?.(activeSegment.id)
  }, [activeSegment.id, onSegmentChange])

  useEffect(() => {
    const engine = engineRef.current
    const element = sectionRef.current
    if (!element) return

    const unregister = engine.register({
      id: sceneId,
      element,
      segments: segments.map((segment) => ({
        id: segment.id,
        lengthVh: segment.lengthVh,
      })),
      onActiveSegmentChange: (segmentId) => {
        setActiveSegmentId(segmentId)
      },
      onStateChange: (state) => {
        isSceneActiveRef.current = state.active
        segmentProgressRef.current = state.segmentProgressById
      },
    })

    return () => {
      unregister()
      engine.destroy()
    }
  }, [sceneId, segments])

  useEffect(() => {
    if (hasReportedInitialMediaReadyRef.current || !onInitialMediaReady) return

    const id = window.requestAnimationFrame(() => {
      hasReportedInitialMediaReadyRef.current = true
      onInitialMediaReady()
    })

    return () => window.cancelAnimationFrame(id)
  }, [onInitialMediaReady])

  useEffect(() => {
    const video = activeVideoRef.current
    if (!video || !activeAsset || activeAsset.kind !== 'video' || policy.preferPosters) {
      setVideoReady(false)
      return
    }

    const handleReady = () => {
      setVideoReady(true)
    }
    const handleError = () => {
      setVideoReady(false)
    }

    setVideoReady(video.readyState >= 2)
    video.muted = true
    video.playsInline = true
    video.autoplay = false
    video.preload = activeSegment.id === 'section-1' || activeSegment.kind === 'transition' ? 'auto' : 'metadata'
    video.loop = activeSegment.playbackMode === 'loop'
    video.poster = activeAsset.posterSrc ?? ''
    video.src = activeAsset.src
    video.addEventListener('loadeddata', handleReady)
    video.addEventListener('canplay', handleReady)
    video.addEventListener('error', handleError)
    video.load()

    if (activeSegment.playbackMode === 'loop') {
      const playPromise = video.play()
      playPromise?.catch(() => undefined)
    } else if (activeSegment.kind === 'transition' && playbackPolicy.canScrub) {
      timedTransitionStartRef.current = null
      video.currentTime = 0
      video.pause()
    } else if (activeSegment.kind === 'transition') {
      timedTransitionStartRef.current = activeSegment.id
      video.loop = false
      let cancelled = false

      const attemptPlay = () => {
        if (cancelled) return
        if (!isSceneActiveRef.current || activeSegmentIdRef.current !== activeSegment.id) return
        if (timedTransitionStartRef.current !== activeSegment.id) return

        const duration = Number.isFinite(video.duration) ? video.duration : 0
        if (duration > 0 && video.currentTime > 0.08) {
          return
        }

        try {
          video.currentTime = 0
        } catch {
          // Safari can throw before metadata is available; retry on readiness events.
        }

        const playPromise = video.play()
        playPromise?.catch(() => undefined)
      }

      const handlePlaybackReady = () => {
        setVideoReady(true)
        attemptPlay()
      }

      video.addEventListener('loadedmetadata', handlePlaybackReady)
      video.addEventListener('loadeddata', handlePlaybackReady)
      video.addEventListener('canplay', handlePlaybackReady)
      video.addEventListener('playing', handlePlaybackReady)

      attemptPlay()

      return () => {
        cancelled = true
        video.pause()
        video.removeEventListener('loadedmetadata', handlePlaybackReady)
        video.removeEventListener('loadeddata', handlePlaybackReady)
        video.removeEventListener('canplay', handlePlaybackReady)
        video.removeEventListener('playing', handlePlaybackReady)
        video.removeEventListener('loadeddata', handleReady)
        video.removeEventListener('canplay', handleReady)
        video.removeEventListener('error', handleError)
      }
    } else {
      timedTransitionStartRef.current = null
      video.pause()
      const setHoldFrame = () => {
        const duration = Number.isFinite(video.duration) ? video.duration : 0
        if (duration > 0) {
          video.currentTime = Math.max(0, duration - 0.05)
          setVideoReady(true)
        }
      }

      if (video.readyState >= 1) {
        setHoldFrame()
      } else {
        video.addEventListener('loadedmetadata', setHoldFrame, { once: true })
      }
    }

    return () => {
      video.pause()
      video.removeEventListener('loadeddata', handleReady)
      video.removeEventListener('canplay', handleReady)
      video.removeEventListener('error', handleError)
    }
  }, [
    activeAsset,
    activeSegment.id,
    activeSegment.kind,
    activeSegment.playbackMode,
    playbackPolicy.canScrub,
    policy.preferPosters,
  ])

  useEffect(() => {
    const prewarmVideo = prewarmVideoRef.current
    if (!prewarmVideo || !nextVideoAsset || !policy.allowDualVideoLayers) return

    prewarmVideo.muted = true
    prewarmVideo.playsInline = true
    prewarmVideo.preload = 'metadata'
    prewarmVideo.poster = nextVideoAsset.posterSrc ?? ''
    prewarmVideo.src = nextVideoAsset.src
    prewarmVideo.load()
  }, [nextVideoAsset, policy.allowDualVideoLayers])

  useEffect(() => {
    const video = activeVideoRef.current
    if (!video || policy.preferPosters) return
    return observeVideoDecodeLag(video, playbackPolicy.reportVideoDecodeLag)
  }, [activeAsset?.src, playbackPolicy.reportVideoDecodeLag, policy.preferPosters])

  useEffect(() => {
    const video = activeVideoRef.current
    if (!video || !activeAsset || activeAsset.kind !== 'video') return

    const shouldScrub = playbackPolicy.canScrub && activeSegment.kind === 'transition'
    if (!shouldScrub) {
      if (scrubRafRef.current) {
        window.cancelAnimationFrame(scrubRafRef.current)
        scrubRafRef.current = null
      }
      return
    }

    let mounted = true
    const scrubTransitionWindow = 0.45
    const tick = () => {
      if (!mounted) return

      if (!isSceneActiveRef.current || video.readyState < 1) {
        scrubRafRef.current = window.requestAnimationFrame(tick)
        return
      }

      const duration = Number.isFinite(video.duration) ? video.duration : 0
      if (duration <= 0) {
        scrubRafRef.current = window.requestAnimationFrame(tick)
        return
      }

      const rawProgress = segmentProgressRef.current[activeSegment.id] ?? 0
      const scrubProgress = clamp((rawProgress - scrubTransitionWindow) / (1 - scrubTransitionWindow))
      const targetTime = scrubProgress * duration
      if (Math.abs(video.currentTime - targetTime) > 0.04) {
        video.currentTime = targetTime
      }
      scrubRafRef.current = window.requestAnimationFrame(tick)
    }

    scrubRafRef.current = window.requestAnimationFrame(tick)

    return () => {
      mounted = false
      if (scrubRafRef.current) {
        window.cancelAnimationFrame(scrubRafRef.current)
        scrubRafRef.current = null
      }
    }
  }, [activeAsset, activeSegment.id, activeSegment.kind, playbackPolicy.canScrub])

  return (
    <section
      ref={sectionRef}
      className={styles.sceneRoot}
      data-active-segment={activeSegment.id}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      style={{ height: `${totalHeightVh}vh` }}
    >
      <div className={styles.stickyStage}>
        <div className={styles.mediaStage}>
          {activeSegment.backgroundColor && (
            <div className={cn('absolute inset-0', activeSegment.backgroundColor)} />
          )}
          {shouldShowPosterFallback && activeAsset?.posterSrc ? (
            <div
              className={styles.posterFallback}
              style={{ backgroundImage: `url(${activeAsset.posterSrc})` }}
            />
          ) : null}
          {activeAsset && activeAsset.kind === 'video' && !policy.preferPosters ? (
            <video
              ref={activeVideoRef}
              muted
              playsInline
              preload="metadata"
              poster={activeAsset.posterSrc ?? undefined}
              aria-hidden="true"
              tabIndex={-1}
              className={styles.mediaVideo}
              data-visible={videoReady ? 'true' : 'false'}
            />
          ) : null}
          {policy.allowDualVideoLayers ? (
            <video
              ref={prewarmVideoRef}
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
              tabIndex={-1}
              className="absolute h-0 w-0 opacity-0 pointer-events-none"
            />
          ) : null}
          {activeSegment.overlay?.() ?? null}
        </div>
        <div className={styles.contentStage}>
          <div className="relative mx-auto flex h-full w-full max-w-6xl px-4">
            {segments.map((segment) => (
              <div key={segment.id}>{segment.render?.(reducedMotion, { resolveImageSrc }) ?? null}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
