'use client'

import { getCueProps } from '@/components/landing/panels/panelChoreography'
import { LandingSurface } from '@/components/landing/panels/LandingSurface'
import type { LandingPanelRuntimeProps } from '@/components/landing/panels/panelTypes'
import { cn } from '@/lib/utils'

export function LocationPanel({ segment, tier }: LandingPanelRuntimeProps) {
  return (
    <LandingSurface theme={segment.theme} tier={tier}>
      <div className="space-y-6">
        <div {...getCueProps('heading')}>
          <h2 className="text-center font-display text-3xl text-dark-gray md:text-4xl">
            Локация и трансфер
          </h2>
        </div>
        <div
          {...getCueProps('body')}
          className={cn(
            getCueProps('body').className,
            'space-y-4 text-lg leading-relaxed text-medium-gray'
          )}
        >
          <div>
            <h3 className="mb-2 font-display text-2xl text-dark-gray">Локация</h3>
            <p>Загородная усадьба «Белый сад»</p>
            <p>Московская область, Истринский район</p>
          </div>
          <div>
            <h3 className="mb-2 font-display text-2xl text-dark-gray">Как добраться</h3>
            <p>
              На личном автомобиле парковка на территории. Маршрут будет доступен в день
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
    </LandingSurface>
  )
}
