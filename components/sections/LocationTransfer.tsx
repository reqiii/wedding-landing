'use client'

import { ScrollScrubVideoSection } from '@/components/ScrollScrubVideoSection'
import { Glass } from '@/components/ui/Glass'
import { SceneContent } from '@/components/sections/SceneContent'

export function LocationTransfer() {
  return (
    <ScrollScrubVideoSection
      id="location"
      className="bg-black"
      heightVh={360}
      videoSrcDesktop="/api/hero-main-video?asset=sun&v=1080"
      videoSrcMobile="/api/hero-main-video?asset=sun&v=720"
      videoProgressEnd={0.5}
      forceScrub
      showOverlay={false}
    >
      {(progress, reducedMotion) => (
        <SceneContent progress={progress} reducedMotion={reducedMotion}>
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
                  На личном автомобиле — парковка на территории. Маршрут будет
                  доступен в день мероприятия.
                </p>
              </div>

              <div>
                <h3 className="font-display text-2xl text-dark-gray mb-2">Трансфер</h3>
                <p>
                  Для гостей будет организован трансфер из центра города. В анкете
                  ниже укажите, нужен ли он вам.
                </p>
              </div>
            </div>
          </Glass>
        </SceneContent>
      )}
    </ScrollScrubVideoSection>
  )
}
