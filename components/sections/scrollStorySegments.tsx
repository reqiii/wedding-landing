'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { RSVPForm } from '@/components/forms/RSVPForm'
import { Glass } from '@/components/ui/Glass'
import styles from '@/components/sections/ScrollStoryScene.module.css'
import type {
  LandingAssetId,
  LandingPlaybackMode,
  LandingSegmentId,
} from '@/lib/landing/mediaManifest'

export type ScrollStorySegmentKind = 'content' | 'transition' | 'fade'

export type SegmentRenderHelpers = {
  resolveImageSrc: (assetId: LandingAssetId) => string
}

export type ScrollStorySegment = {
  id: LandingSegmentId
  kind: ScrollStorySegmentKind
  lengthVh: number
  assetId?: LandingAssetId
  playbackMode?: LandingPlaybackMode
  backgroundColor?: string
  render?: (reducedMotion: boolean, helpers: SegmentRenderHelpers) => JSX.Element
  overlay?: () => JSX.Element | null
}

type ScenePanelProps = {
  segmentId: LandingSegmentId
  className?: string
  alwaysVisible?: boolean
  children: React.ReactNode
}

const ScenePanel = ({
  segmentId,
  className,
  alwaysVisible = false,
  children,
}: ScenePanelProps) => {
  return (
    <div
      data-segment={segmentId}
      data-always-visible={alwaysVisible ? 'true' : 'false'}
      className={`${styles.segmentPanel} mx-auto w-full max-w-4xl ${className ?? ''}`}
      style={
        {
          '--segment-progress': `var(--segment-progress-${segmentId}, 0)`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}

type PushUpPanelProps = {
  segmentId: LandingSegmentId
  className?: string
  render: (textClassName: (index: number) => string) => JSX.Element
}

const PushUpPanel = ({ segmentId, className, render }: PushUpPanelProps) => {
  return (
    <div
      data-segment={segmentId}
      className={`${styles.segmentPanel} mx-auto w-full max-w-4xl ${className ?? ''}`}
      style={
        {
          '--segment-progress': `var(--segment-progress-${segmentId}, 0)`,
        } as CSSProperties
      }
    >
      <div className={styles.pushPanel}>
        {render((index) => styles[`segmentText${index}` as keyof typeof styles] ?? styles.segmentText)}
      </div>
    </div>
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
    <div className="grid grid-cols-2 gap-4 text-dark-gray md:grid-cols-4">
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

export function createScrollStorySegments(
  helpers: SegmentRenderHelpers
): ScrollStorySegment[] {
  return [
    {
      id: 'section-1',
      kind: 'content',
      lengthVh: 100,
      assetId: 'samet',
      playbackMode: 'loop',
      render: () => (
        <ScenePanel
          segmentId="section-1"
          alwaysVisible
          className="max-w-none"
        >
          <div className="flex justify-center">
            <Image
              src={helpers.resolveImageSrc('logo')}
              alt="Логотип"
              width={500}
              height={197}
              sizes="(min-width: 1024px) 500px, (min-width: 768px) 400px, 300px"
              className="h-[414px] w-auto max-w-[95vw] sm:h-[414px] md:h-[197px]"
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
      assetId: 'section1',
      playbackMode: 'scrub',
    },
    {
      id: 'section-2',
      kind: 'content',
      lengthVh: 160,
      assetId: 'section1',
      playbackMode: 'hold',
      render: () => (
        <PushUpPanel
          segmentId="section-2"
          render={(textClassName) => (
            <Glass variant="panel">
              <div className="text-center space-y-6">
                <div className={textClassName(0)}>
                  <h2 className="font-display text-3xl text-dark-gray md:text-4xl">
                    История и приглашение
                  </h2>
                </div>
                <div className={`${textClassName(1)} space-y-4 text-lg leading-relaxed text-medium-gray`}>
                  <p>
                    Мы приглашаем вас разделить с нами день, когда начнется новая глава нашей
                    истории. Это будет вечер теплых встреч, искренних улыбок и красивых моментов.
                  </p>
                  <p>
                    Нам важны ваши присутствие и поддержка — будем счастливы видеть вас рядом в этот
                    особенный день.
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
      assetId: 'section2',
      playbackMode: 'scrub',
    },
    {
      id: 'section-3',
      kind: 'content',
      lengthVh: 170,
      assetId: 'section2',
      playbackMode: 'hold',
      render: () => (
        <PushUpPanel
          segmentId="section-3"
          render={(textClassName) => (
            <Glass variant="panel">
              <div className="space-y-8">
                <div className={textClassName(0)}>
                  <h2 className="font-display text-center text-3xl text-dark-gray md:text-4xl">
                    Главная информация
                  </h2>
                </div>
                <div className={`${textClassName(1)} grid grid-cols-1 gap-6 text-medium-gray md:grid-cols-2`}>
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
      assetId: 'sun',
      playbackMode: 'scrub',
    },
    {
      id: 'section-4',
      kind: 'content',
      lengthVh: 160,
      assetId: 'sun',
      playbackMode: 'hold',
      render: () => (
        <PushUpPanel
          segmentId="section-4"
          render={(textClassName) => (
            <Glass variant="panel">
              <div className="space-y-6">
                <div className={textClassName(0)}>
                  <h2 className="font-display text-center text-3xl text-dark-gray md:text-4xl">
                    Локация и трансфер
                  </h2>
                </div>
                <div className={`${textClassName(1)} space-y-4 text-lg leading-relaxed text-medium-gray`}>
                  <div>
                    <h3 className="mb-2 font-display text-2xl text-dark-gray">Локация</h3>
                    <p>Загородная усадьба «Белый сад»</p>
                    <p>Московская область, Истринский район</p>
                  </div>

                  <div>
                    <h3 className="mb-2 font-display text-2xl text-dark-gray">Как добраться</h3>
                    <p>
                      На личном автомобиле — парковка на территории. Маршрут будет доступен в день
                      мероприятия.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 font-display text-2xl text-dark-gray">Трансфер</h3>
                    <p>
                      Для гостей будет организован трансфер из центра города. В анкете ниже укажите,
                      нужен ли он вам.
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
      assetId: 'sun',
      playbackMode: 'hold',
      overlay: () => (
        <div
          className={styles.segmentOverlay}
          style={
            {
              '--segment-progress': 'var(--segment-progress-transition-4, 0)',
            } as CSSProperties
          }
        />
      ),
    },
    {
      id: 'section-5',
      kind: 'content',
      lengthVh: 170,
      backgroundColor: 'bg-light-gray',
      render: () => (
        <PushUpPanel
          segmentId="section-5"
          render={(textClassName) => (
            <Glass variant="panel">
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <div className={textClassName(0)}>
                    <h2 className="font-display text-3xl text-dark-gray md:text-4xl">Анкета гостя</h2>
                  </div>
                  <div className={textClassName(1)}>
                    <p className="text-lg text-medium-gray">
                      Информация поможет нам при организации торжества.
                      <br />
                      Мы будем ждать от вас ответ до 30 июня.
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
      assetId: 'hero',
      playbackMode: 'scrub',
    },
    {
      id: 'section-6',
      kind: 'content',
      lengthVh: 160,
      assetId: 'hero',
      playbackMode: 'hold',
      render: () => (
        <PushUpPanel
          segmentId="section-6"
          render={(textClassName) => (
            <Glass variant="panel">
              <div className="space-y-6 text-center">
                <div className={textClassName(0)}>
                  <h2 className="font-display text-3xl text-dark-gray md:text-4xl">Мы вас ждём</h2>
                </div>
                <div className={textClassName(1)}>
                  <Countdown />
                </div>
              </div>
            </Glass>
          )}
        />
      ),
    },
  ]
}
