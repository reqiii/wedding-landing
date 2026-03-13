'use client'

import { getCueProps } from '@/components/landing/panels/panelChoreography'
import { LandingSurface } from '@/components/landing/panels/LandingSurface'
import type { LandingPanelRuntimeProps } from '@/components/landing/panels/panelTypes'
import { GlassCard } from '@/components/landing/ui/GlassPanel'

function CountdownPanel({ tier }: { tier: LandingPanelRuntimeProps['tier'] }) {
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
        <GlassCard
          key={item.label}
          tier={tier}
          tone="dark"
          className="shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
          contentClassName="px-4 py-5 text-center"
        >
          <div className="text-3xl font-semibold">{item.value}</div>
          <div className="mt-1 text-sm text-white/70">{item.label}</div>
        </GlassCard>
      ))}
    </div>
  )
}

export function FinalePanel({ segment, tier }: LandingPanelRuntimeProps) {
  return (
    <LandingSurface theme={segment.theme} tier={tier}>
      <div className="space-y-6 text-center">
        <div {...getCueProps('heading')}>
          <h2 className="font-display text-3xl md:text-4xl">Мы вас ждём</h2>
        </div>
        <div {...getCueProps('support')}>
          <CountdownPanel tier={tier} />
        </div>
      </div>
    </LandingSurface>
  )
}
