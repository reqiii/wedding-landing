'use client'

import { ScrollScrubVideoSection } from '@/components/ScrollScrubVideoSection'
import { Glass } from '@/components/ui/Glass'
import { SceneContent } from '@/components/sections/SceneContent'

export function Details() {
  return (
    <ScrollScrubVideoSection
      id="details"
      className="bg-black"
      heightVh={360}
      videoSrcDesktop="/api/hero-main-video?asset=section2&v=1080"
      videoSrcMobile="/api/hero-main-video?asset=section2&v=720"
      videoProgressEnd={0.5}
      forceScrub
      showOverlay={false}
    >
      {(progress, reducedMotion) => (
        <SceneContent progress={progress} reducedMotion={reducedMotion}>
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
                  Будем благодарны за образы в спокойной палитре. Ниже — 5 оттенков,
                  которые особенно красиво поддержат атмосферу вечера.
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
                  Для нас главное — ваше присутствие. Если хотите сделать подарок,
                  будем рады вашему вкладу в нашу общую мечту о путешествии.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-display text-2xl text-dark-gray">Организатор</h3>
                <p>
                  По всем вопросам можно обращаться к нашему организатору.
                </p>
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
        </SceneContent>
      )}
    </ScrollScrubVideoSection>
  )
}
