'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useLandingPlaybackPolicy } from '@/components/homepage/hooks/useLandingPlaybackPolicy'
import {
  createScrollStorySegments,
  type ScrollStorySegment,
} from '@/components/sections/scrollStorySegments'
import { getScrollMetrics, subscribeToScrollMetrics } from '@/components/motion/ScrollScene'
import type { LandingAssetStateMap } from '@/lib/landing/assetStore'
import type { LandingAssetId, LandingSegmentId } from '@/lib/landing/mediaManifest'
import { cn } from '@/lib/utils'

type ScrollStorySceneProps = {
  assets: LandingAssetStateMap
  onInitialMediaReady?: () => void
  onSegmentChange?: (segmentId: LandingSegmentId) => void
}

type BufferedVideoMedia = {
  assetId: LandingAssetId
  key: string
  src: string
  posterSrc: string | null
}

type BufferedVideoLayerState = {
  assetId: LandingAssetId | null
  key: string | null
  src: string | null
  posterSrc: string | null
  renderReady: boolean
  loadToken: number
}

const EMPTY_VIDEO_LAYER: BufferedVideoLayerState = {
  assetId: null,
  key: null,
  src: null,
  posterSrc: null,
  renderReady: false,
  loadToken: 0,
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const lerp = (from: number, to: number, t: number) => from + (to - from) * t

function useBufferedVideoLayer({
  layer,
  videoRef,
  onRenderReady,
}: {
  layer: BufferedVideoLayerState
  videoRef: RefObject<HTMLVideoElement | null>
  onRenderReady: (loadToken: number) => void
}) {
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!layer.src || !layer.key) {
      video.pause()
      video.removeAttribute('src')
      video.removeAttribute('poster')
      video.dataset.layerKey = ''
      video.load()
      return
    }

    let isCancelled = false
    const markReady = () => {
      if (isCancelled) return
      onRenderReady(layer.loadToken)
    }

    const handleError = () => {
      if (isCancelled) return
      video.dataset.layerKey = ''
    }

    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.loop = false

    if (layer.posterSrc) {
      video.poster = layer.posterSrc
    } else {
      video.removeAttribute('poster')
    }

    if (video.dataset.layerKey !== layer.key) {
      video.pause()
      video.dataset.layerKey = layer.key
      video.src = layer.src
      video.load()
    }

    video.addEventListener('loadeddata', markReady)
    video.addEventListener('canplay', markReady)
    video.addEventListener('error', handleError)

    if (video.readyState >= 2) {
      markReady()
    }

    return () => {
      isCancelled = true
      video.removeEventListener('loadeddata', markReady)
      video.removeEventListener('canplay', markReady)
      video.removeEventListener('error', handleError)
    }
  }, [layer.key, layer.loadToken, layer.posterSrc, layer.src, onRenderReady, videoRef])
}

export function ScrollStoryScene({
  assets,
  onInitialMediaReady,
  onSegmentChange,
}: ScrollStorySceneProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const videoLayerARef = useRef<HTMLVideoElement | null>(null)
  const videoLayerBRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const scrubRafRef = useRef<number | null>(null)
  const lastProgressRef = useRef(0)
  const lastActiveRef = useRef(false)
  const localProgressRef = useRef(0)
  const isActiveRef = useRef(false)
  const hasReportedInitialMediaReadyRef = useRef(false)

  const [progress, setProgress] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [activeLayerIndex, setActiveLayerIndex] = useState<number | null>(null)
  const [videoLayers, setVideoLayers] = useState<[BufferedVideoLayerState, BufferedVideoLayerState]>([
    EMPTY_VIDEO_LAYER,
    EMPTY_VIDEO_LAYER,
  ])

  const playbackPolicy = useLandingPlaybackPolicy()
  const reducedMotion = playbackPolicy.prefersReducedMotion
  const canScrub = playbackPolicy.canScrub
  const preferSimpleTransitions = playbackPolicy.preferSimpleTransitions
  const shouldUseBufferedVideoSwap = playbackPolicy.shouldUseBufferedVideoSwap

  const resolveImageSrc = useCallback(
    (assetId: LandingAssetId) => assets[assetId].resolvedSrc ?? assets[assetId].src,
    [assets]
  )

  const resolveVideoMedia = useCallback(
    (assetId: LandingAssetId | null | undefined): BufferedVideoMedia | null => {
      if (!assetId) return null
      const asset = assets[assetId]
      if (!asset || asset.kind !== 'video') return null
      if (asset.status !== 'ready' && asset.status !== 'failed') return null

      const src = asset.resolvedSrc ?? asset.src
      return {
        assetId,
        key: `${assetId}:${src}`,
        src,
        posterSrc: asset.posterSrc ?? null,
      }
    },
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

  const activeSegmentIndex = useMemo(
    () => segmentsWithRange.findIndex((segment) => segment.id === activeSegment.id),
    [activeSegment.id, segmentsWithRange]
  )

  const activePlaybackMode = activeSegment.playbackMode ?? 'hold'
  const showVideo =
    Boolean(activeSegment.assetId) && (activeSegment.kind !== 'content' || !activeSegment.backgroundColor)
  const desiredVideo = showVideo ? resolveVideoMedia(activeSegment.assetId) : null
  const desiredVideoKey = desiredVideo?.key ?? null

  const nextBufferedVideo = useMemo(() => {
    if (activeSegmentIndex === -1) return null

    for (let index = activeSegmentIndex + 1; index < segmentsWithRange.length; index += 1) {
      const candidate = segmentsWithRange[index]
      if (!candidate.assetId || candidate.assetId === activeSegment.assetId) {
        continue
      }
      if (candidate.kind === 'content' && candidate.backgroundColor) {
        continue
      }

      return resolveVideoMedia(candidate.assetId)
    }

    return null
  }, [activeSegment.assetId, activeSegmentIndex, resolveVideoMedia, segmentsWithRange])

  const activeVideoLayer =
    activeLayerIndex === null ? null : videoLayers[activeLayerIndex]
  const inactiveLayerIndex = activeLayerIndex === 0 ? 1 : 0
  const inactiveVideoLayer =
    activeLayerIndex === null ? null : videoLayers[inactiveLayerIndex]
  const activeVideoRef = activeLayerIndex === 1 ? videoLayerBRef : videoLayerARef
  const inactiveVideoRef = activeLayerIndex === 1 ? videoLayerARef : videoLayerBRef

  const setLayerMedia = useCallback(
    (layerIndex: number, media: BufferedVideoMedia | null) => {
      setVideoLayers((current) => {
        const layer = current[layerIndex]

        if (!media) {
          if (!layer.src && !layer.posterSrc) {
            return current
          }

          const next = [...current] as [BufferedVideoLayerState, BufferedVideoLayerState]
          next[layerIndex] = {
            ...EMPTY_VIDEO_LAYER,
            loadToken: layer.loadToken + 1,
          }
          return next
        }

        if (
          layer.key === media.key &&
          layer.src === media.src &&
          layer.posterSrc === media.posterSrc
        ) {
          return current
        }

        const next = [...current] as [BufferedVideoLayerState, BufferedVideoLayerState]
        next[layerIndex] = {
          assetId: media.assetId,
          key: media.key,
          src: media.src,
          posterSrc: media.posterSrc,
          renderReady: false,
          loadToken: layer.loadToken + 1,
        }
        return next
      })
    },
    []
  )

  const markLayerRenderReady = useCallback((layerIndex: number, loadToken: number) => {
    setVideoLayers((current) => {
      const layer = current[layerIndex]
      if (!layer.src || layer.renderReady || layer.loadToken !== loadToken) {
        return current
      }

      const next = [...current] as [BufferedVideoLayerState, BufferedVideoLayerState]
      next[layerIndex] = {
        ...layer,
        renderReady: true,
      }
      return next
    })
  }, [])

  const handleLayerARenderReady = useCallback(
    (loadToken: number) => markLayerRenderReady(0, loadToken),
    [markLayerRenderReady]
  )
  const handleLayerBRenderReady = useCallback(
    (loadToken: number) => markLayerRenderReady(1, loadToken),
    [markLayerRenderReady]
  )

  useBufferedVideoLayer({
    layer: videoLayers[0],
    videoRef: videoLayerARef,
    onRenderReady: handleLayerARenderReady,
  })
  useBufferedVideoLayer({
    layer: videoLayers[1],
    videoRef: videoLayerBRef,
    onRenderReady: handleLayerBRenderReady,
  })

  useEffect(() => {
    onSegmentChange?.(activeSegment.id)
  }, [activeSegment.id, onSegmentChange])

  useEffect(() => {
    if (!desiredVideo) return

    const readyLayerIndex = videoLayers.findIndex(
      (layer) => layer.key === desiredVideo.key && layer.renderReady
    )
    if (readyLayerIndex !== -1) {
      if (activeLayerIndex !== readyLayerIndex) {
        setActiveLayerIndex(readyLayerIndex)
      }

      if (!hasReportedInitialMediaReadyRef.current && onInitialMediaReady) {
        hasReportedInitialMediaReadyRef.current = true
        onInitialMediaReady()
      }
      return
    }

    const targetLayerIndex = activeLayerIndex === 0 ? 1 : 0
    setLayerMedia(targetLayerIndex, desiredVideo)
  }, [activeLayerIndex, desiredVideo, onInitialMediaReady, setLayerMedia, videoLayers])

  useEffect(() => {
    if (!nextBufferedVideo) return
    if (!shouldUseBufferedVideoSwap && preferSimpleTransitions) return
    if (activeLayerIndex === null || !activeVideoLayer?.src) return
    if (desiredVideoKey && activeVideoLayer.key !== desiredVideoKey) return
    if (activeVideoLayer.key === nextBufferedVideo.key) return
    if (inactiveVideoLayer?.key === nextBufferedVideo.key) return

    setLayerMedia(inactiveLayerIndex, nextBufferedVideo)
  }, [
    activeLayerIndex,
    activeVideoLayer,
    desiredVideoKey,
    inactiveLayerIndex,
    inactiveVideoLayer,
    nextBufferedVideo,
    preferSimpleTransitions,
    setLayerMedia,
    shouldUseBufferedVideoSwap,
  ])

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
    const activeVideo = activeVideoRef.current
    if (!activeVideo || !activeVideoLayer?.src) return

    const shouldLoop = activePlaybackMode === 'loop'
    const shouldFreeze = activePlaybackMode === 'scrub' && !canScrub

    activeVideo.muted = true
    activeVideo.playsInline = true
    activeVideo.loop = shouldLoop

    if (shouldLoop) {
      const playPromise = activeVideo.play()
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => undefined)
      }
    } else {
      activeVideo.pause()
    }

    if (activeVideo.readyState < 1) return
    const duration = Number.isFinite(activeVideo.duration) ? activeVideo.duration : 0
    if (duration === 0) return

    if (activePlaybackMode === 'hold') {
      activeVideo.currentTime = Math.max(0, duration - 0.05)
    } else if (shouldFreeze) {
      activeVideo.currentTime = 0
    }
  }, [activePlaybackMode, activeVideoLayer?.key, activeVideoLayer?.src, activeVideoRef, canScrub])

  useEffect(() => {
    const inactiveVideo = inactiveVideoRef.current
    if (!inactiveVideo) return
    inactiveVideo.pause()
  }, [activeLayerIndex, inactiveVideoRef])

  useEffect(() => {
    const activeVideo = activeVideoRef.current
    if (!activeVideo || !activeVideoLayer?.src) return

    const shouldScrub = activePlaybackMode === 'scrub' && canScrub
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
      if (!isActiveRef.current || activeVideo.readyState < 1) {
        scrubRafRef.current = window.requestAnimationFrame(tick)
        return
      }

      const duration = Number.isFinite(activeVideo.duration) ? activeVideo.duration : 0
      if (duration === 0) {
        scrubRafRef.current = window.requestAnimationFrame(tick)
        return
      }

      const targetTime = clamp(localProgressRef.current) * duration
      if (Math.abs(activeVideo.currentTime - targetTime) > 0.04) {
        activeVideo.currentTime = targetTime
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
  }, [activePlaybackMode, activeVideoLayer?.key, activeVideoLayer?.src, activeVideoRef, canScrub])

  const isScrubTransition = activeSegment.kind === 'transition' && activePlaybackMode === 'scrub'
  const transitionProgress = isScrubTransition
    ? clamp(activeSegment.localProgress / scrubTransitionWindow)
    : 1

  useEffect(() => {
    if (activeLayerIndex === null) return
    if (!activeVideoLayer?.src || !inactiveVideoLayer?.src) return
    if (activeVideoLayer.key !== desiredVideoKey) return
    if (inactiveVideoLayer.key === nextBufferedVideo?.key) return

    const shouldKeepCrossfadeLayer =
      isScrubTransition && !preferSimpleTransitions && canScrub && transitionProgress < 1
    if (shouldKeepCrossfadeLayer) return

    setLayerMedia(inactiveLayerIndex, null)
  }, [
    activeLayerIndex,
    activeVideoLayer,
    canScrub,
    desiredVideoKey,
    inactiveLayerIndex,
    inactiveVideoLayer,
    isScrubTransition,
    nextBufferedVideo?.key,
    preferSimpleTransitions,
    setLayerMedia,
    transitionProgress,
  ])

  const totalHeightVh = useMemo(
    () => segments.reduce((sum, segment) => sum + segment.lengthVh, 0),
    [segments]
  )

  const showActiveVideo =
    showVideo && Boolean(activeVideoLayer?.src) && Boolean(activeVideoLayer?.renderReady)
  const showPreviousVideo =
    showVideo &&
    isScrubTransition &&
    !preferSimpleTransitions &&
    canScrub &&
    Boolean(inactiveVideoLayer?.src) &&
    inactiveVideoLayer?.key !== nextBufferedVideo?.key &&
    inactiveVideoLayer?.key !== desiredVideoKey &&
    transitionProgress < 1

  const shouldShowPosterFallback =
    showVideo &&
    Boolean(desiredVideo?.posterSrc) &&
    !showActiveVideo &&
    !showPreviousVideo

  const incomingOpacity = showPreviousVideo ? transitionProgress : 1
  const incomingBlur =
    showPreviousVideo && !preferSimpleTransitions ? lerp(12, 0, transitionProgress) : 0
  const outgoingOpacity = showPreviousVideo ? 1 - transitionProgress : 0
  const outgoingBlur =
    showPreviousVideo && !preferSimpleTransitions ? lerp(0, 10, transitionProgress) : 0
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
          {shouldShowPosterFallback && (
            <div
              className="absolute inset-0 bg-center bg-cover"
              style={{ backgroundImage: `url(${desiredVideo?.posterSrc})` }}
            />
          )}
          <video
            ref={videoLayerARef}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
            style={{
              opacity:
                activeLayerIndex === 0
                  ? showActiveVideo
                    ? incomingOpacity
                    : 0
                  : showPreviousVideo
                    ? outgoingOpacity
                    : 0,
              filter:
                activeLayerIndex === 0
                  ? incomingBlur
                    ? `blur(${incomingBlur}px)`
                    : undefined
                  : outgoingBlur
                    ? `blur(${outgoingBlur}px)`
                    : undefined,
              backgroundColor: '#000',
            }}
          />
          <video
            ref={videoLayerBRef}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
            style={{
              opacity:
                activeLayerIndex === 1
                  ? showActiveVideo
                    ? incomingOpacity
                    : 0
                  : showPreviousVideo
                    ? outgoingOpacity
                    : 0,
              filter:
                activeLayerIndex === 1
                  ? incomingBlur
                    ? `blur(${incomingBlur}px)`
                    : undefined
                  : outgoingBlur
                    ? `blur(${outgoingBlur}px)`
                    : undefined,
              backgroundColor: '#000',
            }}
          />
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
