'use client'

import Image from 'next/image'
import { RSVPForm } from '@/components/forms/RSVPForm'
import styles from '@/components/landing/LandingShell.module.css'
import { LandingSurface } from '@/components/landing/panels/LandingSurface'
import type { LandingPanelKey } from '@/lib/landing/core/contracts'
import type { LandingSegmentConfig } from '@/lib/landing/scenes/sceneTypes'
import { resolveLandingPosterSource } from '@/lib/landing/media/mediaManifest'
import { cn } from '@/lib/utils'

type LandingPanelComponentProps = {
  segment: LandingSegmentConfig
}

type LandingPanelComponent = (props: LandingPanelComponentProps) => JSX.Element

function getCueTransitionDelay(
  segment: LandingSegmentConfig,
  channel: 'eyebrow' | 'heading' | 'body' | 'support'
) {
  const cue = segment.textChoreography.find((entry) => entry.channel === channel)
  return cue ? `${Math.round(cue.start * 280)}ms` : undefined
}

function getCueProps(
  segment: LandingSegmentConfig,
  channel: 'eyebrow' | 'heading' | 'body' | 'support'
) {
  return {
    className: cueClassName(channel),
    'data-channel': channel,
    style: {
      transitionDelay: getCueTransitionDelay(segment, channel),
    },
  } as const
}

const cueClassName = (channel: 'eyebrow' | 'heading' | 'body' | 'support') =>
  cn(styles.cue, 'space-y-2', channel === 'body' ? 'space-y-4' : undefined)

const CountdownPanel = () => {
  const target = new Date('2026-07-23T00:00:00')
  const diff = Math.max(0, target.getTime() - Date.now())
  const totalSeconds = Math.floor(diff / 1000)

  const items = [
    {
      label: 'дней',
      value: Math.floor(totalSeconds / (60 * 60 * 24)),
    },
    {
      label: 'часов',
      value: Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60)),
    },
    {
      label: 'минут',
      value: Math.floor((totalSeconds % (60 * 60)) / 60),
    },
    {
      label: 'секунд',
      value: totalSeconds % 60,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-large border border-white/15 bg-white/10 px-4 py-5 text-center shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        >
          <div className="text-3xl font-semibold">{item.value}</div>
          <div className="mt-1 text-sm text-medium-gray">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

const IntroPanel: LandingPanelComponent = ({ segment }) => (
  <div className="flex min-h-[70dvh] items-start justify-center pt-[min(8vh,3rem)]">
    <div className="w-full text-center">
      <div {...getCueProps(segment, 'heading')}>
        <Image
          src={resolveLandingPosterSource('logo', 'desktop')}
          alt="Логотип"
          width={500}
          height={197}
          priority
          className="mx-auto h-auto w-[min(92vw,32rem)]"
          unoptimized
        />
      </div>
      <div
        {...getCueProps(segment, 'support')}
        className={cn(
          getCueProps(segment, 'support').className,
          'mx-auto mt-8 max-w-xl text-sm uppercase tracking-[0.32em] text-white/70'
        )}
      >
        performance-first cinematic landing foundation
      </div>
    </div>
  </div>
)

const StoryPanel: LandingPanelComponent = ({ segment }) => (
  <LandingSurface theme={segment.theme}>
    <div className="space-y-6 text-center">
      <div {...getCueProps(segment, 'heading')}>
        <h2 className="font-display text-3xl text-dark-gray md:text-4xl">История и приглашение</h2>
      </div>
      <div
        {...getCueProps(segment, 'body')}
        className={cn(getCueProps(segment, 'body').className, 'mx-auto max-w-3xl text-lg leading-relaxed text-medium-gray')}
      >
        <p>
          Мы приглашаем вас разделить с нами день, когда начнется новая глава нашей истории.
          Это будет вечер теплых встреч, искренних улыбок и красивых моментов.
        </p>
        <p>
          Нам важны ваши присутствие и поддержка. Будем счастливы видеть вас рядом в этот
          особенный день.
        </p>
      </div>
    </div>
  </LandingSurface>
)

const DetailsPanel: LandingPanelComponent = ({ segment }) => (
  <LandingSurface theme={segment.theme}>
    <div className="space-y-8">
      <div {...getCueProps(segment, 'heading')}>
        <h2 className="text-center font-display text-3xl text-dark-gray md:text-4xl">
          Главная информация
        </h2>
      </div>
      <div
        {...getCueProps(segment, 'body')}
        className={cn(getCueProps(segment, 'body').className, 'grid grid-cols-1 gap-6 text-medium-gray md:grid-cols-2')}
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
            Будем благодарны за образы в спокойной палитре. Ниже 5 оттенков, которые особенно
            красиво поддержат атмосферу вечера.
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
            Для нас главное ваше присутствие. Если хотите сделать подарок, будем рады вашему
            вкладу в общую мечту о путешествии.
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
  </LandingSurface>
)

const LocationPanel: LandingPanelComponent = ({ segment }) => (
  <LandingSurface theme={segment.theme}>
    <div className="space-y-6">
      <div {...getCueProps(segment, 'heading')}>
        <h2 className="text-center font-display text-3xl text-dark-gray md:text-4xl">
          Локация и трансфер
        </h2>
      </div>
      <div
        {...getCueProps(segment, 'body')}
        className={cn(getCueProps(segment, 'body').className, 'space-y-4 text-lg leading-relaxed text-medium-gray')}
      >
        <div>
          <h3 className="mb-2 font-display text-2xl text-dark-gray">Локация</h3>
          <p>Загородная усадьба «Белый сад»</p>
          <p>Московская область, Истринский район</p>
        </div>
        <div>
          <h3 className="mb-2 font-display text-2xl text-dark-gray">Как добраться</h3>
          <p>На личном автомобиле парковка на территории. Маршрут будет доступен в день мероприятия.</p>
        </div>
        <div>
          <h3 className="mb-2 font-display text-2xl text-dark-gray">Трансфер</h3>
          <p>Для гостей будет организован трансфер из центра города. В анкете ниже укажите, нужен ли он вам.</p>
        </div>
      </div>
    </div>
  </LandingSurface>
)

const RsvpPanel: LandingPanelComponent = ({ segment }) => (
  <LandingSurface theme={segment.theme}>
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div {...getCueProps(segment, 'heading')}>
          <h2 className="font-display text-3xl text-dark-gray md:text-4xl">Анкета гостя</h2>
        </div>
        <div {...getCueProps(segment, 'body')}>
          <p className="text-lg text-medium-gray">
            Информация поможет нам при организации торжества.
            <br />
            Мы будем ждать ответ до 30 июня.
          </p>
        </div>
      </div>
      <RSVPForm />
    </div>
  </LandingSurface>
)

const FinalePanel: LandingPanelComponent = ({ segment }) => (
  <LandingSurface theme={segment.theme}>
    <div className="space-y-6 text-center">
      <div {...getCueProps(segment, 'heading')}>
        <h2 className="font-display text-3xl md:text-4xl">Мы вас ждём</h2>
      </div>
      <div {...getCueProps(segment, 'support')}>
        <CountdownPanel />
      </div>
    </div>
  </LandingSurface>
)

const PANEL_REGISTRY: Record<LandingPanelKey, LandingPanelComponent> = {
  intro: IntroPanel,
  story: StoryPanel,
  details: DetailsPanel,
  location: LocationPanel,
  rsvp: RsvpPanel,
  finale: FinalePanel,
}

export function getLandingPanelComponent(panelKey: LandingPanelKey) {
  return PANEL_REGISTRY[panelKey]
}
