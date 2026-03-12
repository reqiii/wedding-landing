'use client'

import { getCueProps } from '@/components/landing/panels/panelChoreography'
import { LandingSurface } from '@/components/landing/panels/LandingSurface'
import type { LandingPanelRuntimeProps } from '@/components/landing/panels/panelTypes'
import { cn } from '@/lib/utils'

export function DetailsPanel({ segment, tier }: LandingPanelRuntimeProps) {
  return (
    <LandingSurface theme={segment.theme} tier={tier}>
      <div className="space-y-8">
        <div {...getCueProps(segment, 'heading')}>
          <h2 className="text-center font-display text-3xl text-dark-gray md:text-4xl">
            Главная информация
          </h2>
        </div>
        <div
          {...getCueProps(segment, 'body')}
          className={cn(
            getCueProps(segment, 'body').className,
            'grid grid-cols-1 gap-6 text-medium-gray md:grid-cols-2'
          )}
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
}
