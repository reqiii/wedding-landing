'use client'

import { useEffect, useRef } from 'react'
import styles from '@/components/landing/LandingShell.module.css'
import { getLandingPanelComponent } from '@/components/landing/panels/panelRegistry'
import type { LandingReadinessState } from '@/lib/landing/core/contracts'
import type {
  LandingPanelLifecycle,
  LandingPanelPosition,
} from '@/lib/landing/scenes/sceneSelectors'
import type { LandingSegmentConfig, LandingSegmentId } from '@/lib/landing/scenes/sceneTypes'
import type { LandingTierId } from '@/lib/landing/tier/tierTypes'

type LandingPanelFrameProps = {
  segment: LandingSegmentConfig
  tier: LandingTierId
  allowPremiumEffects: boolean
  prefersReducedMotion: boolean
  lifecycle: LandingPanelLifecycle
  position: LandingPanelPosition
  progressSegmentId: LandingSegmentId
  assetReadyState?: LandingReadinessState
}

export function LandingPanelFrame({
  segment,
  tier,
  allowPremiumEffects,
  prefersReducedMotion,
  lifecycle,
  position,
  progressSegmentId,
  assetReadyState = 'idle',
}: LandingPanelFrameProps) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const Panel = getLandingPanelComponent(segment.panelKey!)
  const isActive = lifecycle === 'active'

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
      data-lifecycle={lifecycle}
      data-position={position}
      data-panel-key={segment.panelKey ?? 'none'}
      data-motion={segment.motionPreset}
      data-theme={segment.theme}
      data-asset-ready={assetReadyState}
      aria-hidden={isActive ? undefined : 'true'}
      style={
        {
          ['--landing-segment-progress' as string]: `var(--segment-progress-${progressSegmentId}, var(--landing-segment-progress, 0))`,
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
