'use client'

import { useEffect, useRef } from 'react'
import styles from '@/components/landing/LandingShell.module.css'
import { getLandingPanelComponent } from '@/components/landing/panels/panelRegistry'
import type { LandingReadinessState } from '@/lib/landing/core/contracts'
import type { LandingSegmentConfig } from '@/lib/landing/scenes/sceneTypes'
import type { LandingTierId } from '@/lib/landing/tier/tierTypes'

type LandingPanelFrameProps = {
  segment: LandingSegmentConfig
  tier: LandingTierId
  allowPremiumEffects: boolean
  prefersReducedMotion: boolean
  isActive: boolean
  position: 'previous' | 'current' | 'next'
  assetReadyState?: LandingReadinessState
}

export function LandingPanelFrame({
  segment,
  tier,
  allowPremiumEffects,
  prefersReducedMotion,
  isActive,
  position,
  assetReadyState = 'idle',
}: LandingPanelFrameProps) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const Panel = getLandingPanelComponent(segment.panelKey!)
  const residency = isActive ? 'active' : 'nearby'

  useEffect(() => {
    const element = frameRef.current
    if (!element) {
      return
    }

    if (isActive) {
      element.removeAttribute('inert')
      return
    }

    element.setAttribute('inert', '')
  }, [isActive])

  return (
    <div
      ref={frameRef}
      className={styles.panelFrame}
      data-active={isActive ? 'true' : 'false'}
      data-residency={residency}
      data-position={position}
      data-motion={segment.motionPreset}
      data-theme={segment.theme}
      data-asset-ready={assetReadyState}
      aria-hidden={isActive ? undefined : 'true'}
      style={
        {
          ['--landing-segment-progress' as string]: `var(--segment-progress-${segment.id}, var(--landing-segment-progress, 0))`,
        }
      }
    >
      <div className={styles.panelMotion}>
        <Panel
          segment={segment}
          tier={tier}
          allowPremiumEffects={allowPremiumEffects}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>
    </div>
  )
}
