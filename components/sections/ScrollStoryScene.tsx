'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Glass } from '@/components/ui/Glass'
import { RSVPForm } from '@/components/forms/RSVPForm'
import { cn } from '@/lib/utils'
import { getScrollMetrics, subscribeToScrollMetrics } from '@/components/motion/ScrollScene'

type SegmentKind = 'content' | 'transition' | 'fade'

type SegmentVideo = {
  desktop: string
  mobile: string
  mode: 'scrub' | 'loop' | 'hold'
}

type Segment = {
  id: string
  kind: SegmentKind
  lengthVh: number
  video?: SegmentVideo
  backgroundColor?: string
  render?: (progress: number, reducedMotion: boolean) => JSX.Element
  overlay?: (progress: number) => JSX.Element | null
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const lerp = (from: number, to: number, t: number) => from + (to - from) * t

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  return reduced
}

const useMobileSafari = () => {
  const [isMobileSafari, setIsMobileSafari] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ua = window.navigator.userAgent
    const isIOS = /iP(ad|hone|od)/.test(ua)
    const isWebkit = /WebKit/.test(ua)
    const isCriOS = /CriOS/.test(ua)
    const isFxiOS = /FxiOS/.test(ua)
    setIsMobileSafari(isIOS && isWebkit && !isCriOS && !isFxiOS)
  }, [])

  return isMobileSafari
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  return isMobile
}

type ScenePanelProps = {
  progress: number
  reducedMotion: boolean
  className?: string
  alwaysVisible?: boolean
  children: React.ReactNode
}

const ScenePanel = ({
  progress,
  reducedMotion,
  className,
  alwaysVisible = false,
  children,
}: ScenePanelProps) => {
  const previousProgressRef = useRef(progress)
  const isScrollingUp = progress < previousProgressRef.current

  useEffect(() => {
    previousProgressRef.current = progress
  }, [progress])

  const motionProgress = isScrollingUp ? 1 - progress : progress

  if (reducedMotion || alwaysVisible) {
    return <div className={cn('mx-auto w-full max-w-4xl', className)}>{children}</div>
  }

  const appearStart = 0.25
  const appearEnd = 0.45
  const holdEnd = 0.9
  const exitEnd = 1.0

  const appearProgress = clamp((motionProgress - appearStart) / (appearEnd - appearStart))
  const exitProgress = clamp((motionProgress - holdEnd) / (exitEnd - holdEnd))

  let opacity = 1
  let translateY = lerp(48, 0, appearProgress)

  if (motionProgress >= holdEnd) {
    opacity = 1 - exitProgress
    translateY = lerp(0, -28, exitProgress)
  }

  const isVisible = motionProgress >= appearStart

  return (
    <div
      className={cn('mx-auto w-full max-w-4xl', className)}
      style={{
        opacity: isVisible ? opacity : 0,
        transform: `translate3d(0, ${translateY}px, 0)`,
        visibility: isVisible ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>
  )
}

type TextStyleBuilder = (index: number) => React.CSSProperties

type PushUpPanelProps = {
  progress: number
  reducedMotion: boolean
  className?: string
  render: (textStyle: TextStyleBuilder) => JSX.Element
}

const PushUpPanel = ({ progress, reducedMotion, className, render }: PushUpPanelProps) => {
  const resolvedProgress = reducedMotion ? 1 : progress
  const moveEnd = 0.35
  const expandEnd = 0.4
  const textStart = moveEnd + 0.08
  const textDuration = 0.14
  const moveProgress = clamp(resolvedProgress / moveEnd)
  const expandProgress = clamp((resolvedProgress - 0.05) / (expandEnd - 0.05))
  const textProgress = clamp((resolvedProgress - textStart) / textDuration)

  const translateY = lerp(110, 0, moveProgress)
  const scaleY = lerp(0.78, 1, expandProgress)

  const buildTextStyle = (index: number) => {
    const staggerStart = index * 0.12
    const localText = clamp((textProgress - staggerStart) / 0.7)
    const opacity = clamp(localText * 1.4)
    return {
      opacity,
      transform: `translate3d(0, ${lerp(16, 0, localText)}px, 0)`,
      transition: 'none',
    }
  }

  return (
    <div className={cn('mx-auto w-full max-w-4xl', className)}>
      <div
        style={{
          transform: `translate3d(0, ${translateY}vh, 0) scaleY(${scaleY})`,
          transformOrigin: 'bottom center',
          willChange: 'transform',
        }}
      >
        {render(buildTextStyle)}
      </div>
    </div>
  )
}

export function ScrollStoryScene() {
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

  const reducedMotion = useReducedMotion()
  const isMobileSafari = useMobileSafari()
  const isMobile = useIsMobile()
  const allowScrub = !reducedMotion && !isMobileSafari

  const [progress, setProgress] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [videoMode, setVideoMode] = useState<SegmentVideo['mode']>('hold')
  const [previousVideoSrc, setPreviousVideoSrc] = useState<string | null>(null)
  const lastVideoSrcRef = useRef<string | null>(null)

  const segments = useMemo<Segment[]>(
    () => [
      {
        id: 'section-1',
        kind: 'content',
        lengthVh: 100,
        video: {
          desktop: '/api/hero-video?asset=samet',
          mobile: '/api/hero-video?asset=samet',
          mode: 'loop',
        },
        render: () => (
          <ScenePanel
            progress={1}
            reducedMotion={reducedMotion}
            alwaysVisible
            className="max-w-none"
          >
            <div className="flex justify-center">
              <Image
                src="/api/hero-main-video?asset=logo"
                alt="Логотип"
                width={500}
                height={197}
                sizes="(min-width: 1024px) 500px, (min-width: 768px) 400px, 300px"
                className="h-[414px] sm:h-[414px] md:h-[197px] w-auto max-w-[95vw]"
                priority
                unoptimized
              />
            </div>
          </ScenePanel>
        ),
      },
      {
        id: 'transition-1',
        kind: 'transition',
        lengthVh: 150,
        video: {
          desktop: '/api/hero-main-video?asset=section1&v=1080',
          mobile: '/api/hero-main-video?asset=section1&v=720',
          mode: 'scrub',
        },
      },
      {
        id: 'section-2',
        kind: 'content',
        lengthVh: 160,
        video: {
          desktop: '/api/hero-main-video?asset=section1&v=1080',
          mobile: '/api/hero-main-video?asset=section1&v=720',
          mode: 'hold',
        },
        render: (localProgress) => (
          <PushUpPanel
            progress={localProgress}
            reducedMotion={reducedMotion}
            render={(textStyle) => (
              <Glass variant="panel">
                <div className="text-center space-y-6">
                  <div style={textStyle(0)}>
                    <h2 className="font-display text-3xl md:text-4xl text-dark-gray">
                      История и приглашение
                    </h2>
                  </div>
                  <div style={textStyle(1)} className="space-y-4 text-medium-gray text-lg leading-relaxed">
                    <p>
                      Мы приглашаем вас разделить с нами день, когда начнется новая глава нашей
                      истории. Это будет вечер теплых встреч, искренних улыбок и красивых моментов.
                    </p>
                    <p>
                      Нам важны ваши присутствие и поддержка — будем счастливы видеть вас рядом в
                      этот особенный день.
                    </p>
                  </div>
                </div>
              </Glass>
            )}
          />
        ),
      },
      {
        id: 'transition-2',
        kind: 'transition',
        lengthVh: 150,
        video: {
          desktop: '/api/hero-main-video?asset=section2&v=1080',
          mobile: '/api/hero-main-video?asset=section2&v=720',
          mode: 'scrub',
        },
      },
      {
        id: 'section-3',
        kind: 'content',
        lengthVh: 170,
        video: {
          desktop: '/api/hero-main-video?asset=section2&v=1080',
          mobile: '/api/hero-main-video?asset=section2&v=720',
          mode: 'hold',
        },
        render: (localProgress) => (
          <PushUpPanel
            progress={localProgress}
            reducedMotion={reducedMotion}
            render={(textStyle) => (
              <Glass variant="panel">
                <div className="space-y-8">
                  <div style={textStyle(0)}>
                    <h2 className="font-display text-3xl md:text-4xl text-dark-gray text-center">
                      Главная информация
                    </h2>
                  </div>
                  <div
                    style={textStyle(1)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 text-medium-gray"
                  >
                    <div className="space-y-3">
                      <h3 className="font-display text-2xl text-dark-gray">Тайминг</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between gap-4">
                          <span className="font-semibold text-dark-gray">16:00</span>
                          <span>Сбор гостей</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="font-semibold text-dark-gray">17:00</span>
                          <span>Церемония</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="font-semibold text-dark-gray">18:00</span>
                          <span>Ужин и программа</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="font-semibold text-dark-gray">22:30</span>
                          <span>Танцы и финал</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-display text-2xl text-dark-gray">Дресс-код</h3>
                      <p>
                        Будем благодарны за образы в спокойной палитре. Ниже — 5 оттенков, которые
                        особенно красиво поддержат атмосферу вечера.
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                        <span className="h-6 w-6 rounded-full bg-[#F5E6D3]" aria-hidden="true" />
                        <span className="h-6 w-6 rounded-full bg-[#FFD4B3]" aria-hidden="true" />
                        <span className="h-6 w-6 rounded-full bg-[#FFC4D6]" aria-hidden="true" />
                        <span className="h-6 w-6 rounded-full bg-[#B8E6E6]" aria-hidden="true" />
                        <span className="h-6 w-6 rounded-full bg-[#A8D8E8]" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-display text-2xl text-dark-gray">Подарки</h3>
                      <p>
                        Для нас главное — ваше присутствие. Если хотите сделать подарок, будем рады
                        вашему вкладу в нашу общую мечту о путешествии.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-display text-2xl text-dark-gray">Организатор</h3>
                      <p>По всем вопросам можно обращаться к нашему организатору.</p>
                      <p>
                        <strong className="text-dark-gray">Анна, свадебный координатор</strong>
                        <br />
                        Телефон: +7 (999) 123-45-67
                        <br />
                        Telegram: @wedding_helper
                      </p>
                    </div>
                  </div>
                </div>
              </Glass>
            )}
          />
        ),
      },
      {
        id: 'transition-3',
        kind: 'transition',
        lengthVh: 150,
        video: {
          desktop: '/api/hero-main-video?asset=sun&v=1080',
          mobile: '/api/hero-main-video?asset=sun&v=720',
          mode: 'scrub',
        },
      },
      {
        id: 'section-4',
        kind: 'content',
        lengthVh: 160,
        video: {
          desktop: '/api/hero-main-video?asset=sun&v=1080',
          mobile: '/api/hero-main-video?asset=sun&v=720',
          mode: 'hold',
        },
        render: (localProgress) => (
          <PushUpPanel
            progress={localProgress}
            reducedMotion={reducedMotion}
            render={(textStyle) => (
              <Glass variant="panel">
                <div className="space-y-6">
                  <div style={textStyle(0)}>
                    <h2 className="font-display text-3xl md:text-4xl text-dark-gray text-center">
                      Локация и трансфер
                    </h2>
                  </div>
                  <div
                    style={textStyle(1)}
                    className="space-y-4 text-medium-gray text-lg leading-relaxed"
                  >
                    <div>
                      <h3 className="font-display text-2xl text-dark-gray mb-2">Локация</h3>
                      <p>Загородная усадьба «Белый сад»</p>
                      <p>Московская область, Истринский район</p>
                    </div>

                    <div>
                      <h3 className="font-display text-2xl text-dark-gray mb-2">Как добраться</h3>
                      <p>
                        На личном автомобиле — парковка на территории. Маршрут будет доступен в день
                        мероприятия.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-display text-2xl text-dark-gray mb-2">Трансфер</h3>
                      <p>
                        Для гостей будет организован трансфер из центра города. В анкете ниже
                        укажите, нужен ли он вам.
                      </p>
                    </div>
                  </div>
                </div>
              </Glass>
            )}
          />
        ),
      },
      {
        id: 'transition-4',
        kind: 'fade',
        lengthVh: 110,
        video: {
          desktop: '/api/hero-main-video?asset=sun&v=1080',
          mobile: '/api/hero-main-video?asset=sun&v=720',
          mode: 'hold',
        },
        overlay: (localProgress) => (
          <div className="absolute inset-0 bg-light-gray" style={{ opacity: clamp(localProgress) }} />
        ),
      },
      {
        id: 'section-5',
        kind: 'content',
        lengthVh: 170,
        backgroundColor: 'bg-light-gray',
        render: (localProgress) => (
          <PushUpPanel
            progress={localProgress}
            reducedMotion={reducedMotion}
            render={(textStyle) => (
              <Glass variant="panel">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div style={textStyle(0)}>
                      <h2 className="font-display text-3xl md:text-4xl text-dark-gray">
                        Анкета гостя
                      </h2>
                    </div>
                    <div style={textStyle(1)}>
                      <p className="text-medium-gray text-lg">
                        Информация поможет нам при организации торжества.
                        <br />Мы будем ждать от вас ответ до 30 июня.
                      </p>
                    </div>
                  </div>
                  <RSVPForm />
                </div>
              </Glass>
            )}
          />
        ),
      },
      {
        id: 'transition-5',
        kind: 'transition',
        lengthVh: 150,
        video: {
          desktop: '/api/hero-main-video?asset=hero&v=1080',
          mobile: '/api/hero-main-video?asset=hero&v=720',
          mode: 'scrub',
        },
      },
      {
        id: 'section-6',
        kind: 'content',
        lengthVh: 160,
        video: {
          desktop: '/api/hero-main-video?asset=hero&v=1080',
          mobile: '/api/hero-main-video?asset=hero&v=720',
          mode: 'hold',
        },
        render: (localProgress) => (
          <PushUpPanel
            progress={localProgress}
            reducedMotion={reducedMotion}
            render={(textStyle) => (
              <Glass variant="panel">
                <div className="text-center space-y-6">
                  <div style={textStyle(0)}>
                    <h2 className="font-display text-3xl md:text-4xl text-dark-gray">Мы вас ждём</h2>
                  </div>
                  <div style={textStyle(1)}>
                    <Countdown />
                  </div>
                </div>
              </Glass>
            )}
          />
        ),
      },
    ],
    [reducedMotion]
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

  const activeVideo = activeSegment.video
  const resolvedVideoSrc = activeVideo ? (isMobile ? activeVideo.mobile : activeVideo.desktop) : null

  useEffect(() => {
    setVideoSrc(resolvedVideoSrc)
    setVideoMode(activeVideo?.mode ?? 'hold')
    isReadyRef.current = false
  }, [resolvedVideoSrc, activeVideo?.mode])

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
    const video = videoRef.current
    if (!video || !videoSrc) return

    const shouldLoop = videoMode === 'loop'
    const shouldAutoplay = videoMode === 'scrub' && !allowScrub

    video.muted = true
    video.playsInline = true
    video.loop = shouldLoop || shouldAutoplay

    if (shouldLoop || shouldAutoplay) {
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
    }
  }, [videoMode, allowScrub, videoSrc])

  const scrubTransitionWindow = 0.45

  useEffect(() => {
    const isScrubTransition = activeSegment.kind === 'transition' && activeVideo?.mode === 'scrub'
    const scrubProgress = isScrubTransition
      ? clamp((activeSegment.localProgress - scrubTransitionWindow) / (1 - scrubTransitionWindow))
      : activeSegment.localProgress
    localProgressRef.current = scrubProgress
  }, [
    activeSegment.kind,
    activeSegment.localProgress,
    activeVideo?.mode,
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

    const shouldScrub = videoMode === 'scrub' && allowScrub

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
  }, [videoMode, allowScrub, videoSrc])

  const totalHeightVh = useMemo(
    () => segments.reduce((sum, segment) => sum + segment.lengthVh, 0),
    [segments]
  )

  const showVideo =
    Boolean(activeVideo) && (activeSegment.kind !== 'content' || !activeSegment.backgroundColor)

  const isScrubTransition = activeSegment.kind === 'transition' && activeVideo?.mode === 'scrub'
  const transitionProgress = isScrubTransition
    ? clamp(activeSegment.localProgress / scrubTransitionWindow)
    : 1
  const showPreviousVideo =
    isScrubTransition && !reducedMotion && Boolean(previousVideoSrc) && transitionProgress < 1
  const incomingOpacity = isScrubTransition && !reducedMotion ? (showPreviousVideo ? transitionProgress : 1) : 1
  const incomingBlur = isScrubTransition && !reducedMotion ? lerp(12, 0, transitionProgress) : 0
  const outgoingOpacity = showPreviousVideo ? 1 - transitionProgress : 0
  const outgoingBlur = showPreviousVideo ? lerp(0, 10, transitionProgress) : 0

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
                filter: `blur(${outgoingBlur}px)`,
                backgroundColor: '#000',
              }}
            />
          )}
          {showVideo && (
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
        <div className="relative z-10 flex h-full items-center">
          <div className="mx-auto w-full max-w-6xl px-4">
            {activeSegment.render?.(activeSegment.localProgress, reducedMotion)}
          </div>
        </div>
      </div>
    </section>
  )
}

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

const Countdown = () => {
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

  const display = mounted ? countdown : { days: 0, hours: 0, minutes: 0, seconds: 0 }

  return (
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
  )
}
