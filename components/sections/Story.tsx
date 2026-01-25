'use client'

import { ScrollScrubVideoSection } from '@/components/ScrollScrubVideoSection'
import { Glass } from '@/components/ui/Glass'
import { SceneContent } from '@/components/sections/SceneContent'

export function Story() {
  return (
    <ScrollScrubVideoSection
      id="story"
      className="bg-black"
      heightVh={360}
      videoSrcDesktop="/api/hero-main-video?asset=section1&v=1080"
      videoSrcMobile="/api/hero-main-video?asset=section1&v=720"
      videoProgressEnd={0.5}
      forceScrub
      showOverlay={false}
    >
      {(progress, reducedMotion) => (
        <SceneContent progress={progress} reducedMotion={reducedMotion} className="text-center">
          <Glass variant="panel">
            <h2 className="font-display text-3xl md:text-4xl text-dark-gray mb-6">
              История и приглашение
            </h2>
            <div className="space-y-4 text-medium-gray text-lg leading-relaxed">
              <p>
                Мы приглашаем вас разделить с нами день, когда начнется новая глава
                нашей истории. Это будет вечер теплых встреч, искренних улыбок и
                красивых моментов.
              </p>
              <p>
                Нам важны ваши присутствие и поддержка — будем счастливы видеть вас
                рядом в этот особенный день.
              </p>
            </div>
          </Glass>
        </SceneContent>
      )}
    </ScrollScrubVideoSection>
  )
}
