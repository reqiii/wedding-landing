'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Glass } from '@/components/ui/Glass'
import { RSVPForm } from '@/components/forms/RSVPForm'
import { cn } from '@/lib/utils'

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
  if (reducedMotion || alwaysVisible) {
    return <div className={cn('mx-auto w-full max-w-4xl', className)}>{children}</div>
  }

  const appearStart = 0.25
  const appearEnd = 0.45
  const holdEnd = 0.9
  const exitEnd = 1.0

  const appearProgress = clamp((progress - appearStart) / (appearEnd - appearStart))
  const exitProgress = clamp((progress - holdEnd) / (exitEnd - holdEnd))

  let opacity = 1
  let translateY = lerp(48, 0, appearProgress)

  if (progress >= holdEnd) {
    opacity = 1 - exitProgress
    translateY = lerp(0, -28, exitProgress)
  }

  const isVisible = progress >= appearStart

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

export function ScrollStoryScene() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const durationRef = useRef(0)
  const isReadyRef = useRef(false)

  const reducedMotion = useReducedMotion()
  const isMobileSafari = useMobileSafari()
  const isMobile = useIsMobile()
  const allowScrub = !reducedMotion && !isMobileSafari

  const [progress, setProgress] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [videoMode, setVideoMode] = useState<SegmentVideo['mode']>('hold')

  const segments = useMemo<Segment[]>(
    () => [
      {
        id: 'section-1',
        kind: 'content',
        lengthVh: 170,
        video: {
          desktop: '/api/hero-video?asset=samet',
          mobile: '/api/hero-video?asset=samet',
          mode: 'loop',
        },
        render: () => (
          <ScenePanel progress={1} reducedMotion={reducedMotion} alwaysVisible>
            <Glass variant="hero" className="w-full">
              <div className="flex flex-col items-center gap-6 text-center">
                <Image
                  src="/api/hero-main-video?asset=logo"
                  alt="Логотип"
                  width={360}
                  height={140}
                  sizes="(min-width: 768px) 360px, 280px"
                  className="h-28 md:h-32 w-auto"
                  priority
                  unoptimized
                />
                <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-normal text-dark-gray">
                  Роман и Анастасия
                </h1>
                <p className="text-xl md:text-2xl text-medium-gray font-light">23.07.2026</p>
              </div>
            </Glass>
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
          <ScenePanel progress={localProgress} reducedMotion={reducedMotion}>
            <Glass variant="panel">
              <div className="text-center space-y-6">
                <h2 className="font-display text-3xl md:text-4xl text-dark-gray">
                  История и приглашение
                </h2>
                <div className="space-y-4 text-medium-gray text-lg leading-relaxed">
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
          </ScenePanel>
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
          <ScenePanel progress={localProgress} reducedMotion={reducedMotion}>
            <Glass variant="panel" className="space-y-8">
              <h2 className="font-display text-3xl md:text-4xl text-dark-gray text-center">
                Главная информация
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-medium-gray">
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
            </Glass>
          </ScenePanel>
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
          <ScenePanel progress={localProgress} reducedMotion={reducedMotion}>
            <Glass variant="panel" className="space-y-6">
              <h2 className="font-display text-3xl md:text-4xl text-dark-gray text-center">
                Локация и трансфер
              </h2>
              <div className="space-y-4 text-medium-gray text-lg leading-relaxed">
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
                    Для гостей будет организован трансфер из центра города. В анкете ниже укажите,
                    нужен ли он вам.
                  </p>
                </div>
              </div>
            </Glass>
          </ScenePanel>
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
          <ScenePanel progress={localProgress} reducedMotion={reducedMotion}>
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
          </ScenePanel>
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
          <ScenePanel progress={localProgress} reducedMotion={reducedMotion}>
            <Glass variant="panel" className="text-center space-y-6">
              <h2 className="font-display text-3xl md:text-4xl text-dark-gray">
                Мы вас ждём
              </h2>
              <Countdown />
            </Glass>
          </ScenePanel>
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
    const shouldScrub = videoMode === 'scrub' && allowScrub
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

    if (shouldScrub) {
      const targetTime = clamp(activeSegment.localProgress) * durationRef.current
      if (Math.abs(video.currentTime - targetTime) > 0.02) {
        video.currentTime = targetTime
      }
    }
  }, [videoMode, allowScrub, activeSegment.localProgress, videoSrc])

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
      const scrollProgress = clamp(progressRaw, 0, 1)
      setProgress(scrollProgress)
      setIsActive(progressRaw >= 0 && progressRaw <= 1)
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
  }, [])

  const totalHeightVh = useMemo(
    () => segments.reduce((sum, segment) => sum + segment.lengthVh, 0),
    [segments]
  )

  const showVideo =
    Boolean(activeVideo) && (activeSegment.kind !== 'content' || !activeSegment.backgroundColor)

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
        <div className="absolute inset-0">
          {activeSegment.backgroundColor && (
            <div className={cn('absolute inset-0', activeSegment.backgroundColor)} />
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
      <div className="rounded-medium bg-white/40 px-4 py-3">
        <div className="text-3xl font-semibold">{display.days}</div>
        <div className="text-sm text-medium-gray">дней</div>
      </div>
      <div className="rounded-medium bg-white/40 px-4 py-3">
        <div className="text-3xl font-semibold">{display.hours}</div>
        <div className="text-sm text-medium-gray">часов</div>
      </div>
      <div className="rounded-medium bg-white/40 px-4 py-3">
        <div className="text-3xl font-semibold">{display.minutes}</div>
        <div className="text-sm text-medium-gray">минут</div>
      </div>
      <div className="rounded-medium bg-white/40 px-4 py-3">
        <div className="text-3xl font-semibold">{display.seconds}</div>
        <div className="text-sm text-medium-gray">секунд</div>
      </div>
    </div>
  )
}
