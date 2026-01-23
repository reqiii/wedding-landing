'use client'

import { ScrollScene, SceneReveal } from '@/components/motion/ScrollScene'

export function Footer() {
  return (
    <ScrollScene className="relative" innerClassName="py-12 px-4 text-center">
      <div className="max-w-4xl mx-auto">
        <SceneReveal start={0.2} duration={0.3}>
          <p className="text-medium-gray text-sm">
            © {new Date().getFullYear()} Our Wedding. Made with ❤️
          </p>
        </SceneReveal>
      </div>
    </ScrollScene>
  )
}
