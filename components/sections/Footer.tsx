'use client'

import { ScrollScene, SceneReveal } from '@/components/motion/ScrollScene'
import { Glass } from '@/components/ui/Glass'

export function Footer() {
  return (
    <ScrollScene className="relative" innerClassName="py-12 px-4 text-center">
      <div className="max-w-4xl mx-auto flex justify-center">
        <SceneReveal start={0.2} duration={0.3}>
          <Glass variant="card" className="glass-compact">
            <p className="text-medium-gray text-sm">
              © {new Date().getFullYear()} Our Wedding. Made with ❤️
            </p>
          </Glass>
        </SceneReveal>
      </div>
    </ScrollScene>
  )
}
