'use client'

import styles from '@/components/landing/LandingShell.module.css'
import { LandingPanelFrame } from '@/components/landing/panels/LandingPanelFrame'
import { GlassOverlay } from '@/components/landing/ui/GlassPanel'
import { getVisibleLandingSegments } from '@/lib/landing/scenes/sceneSelectors'
import type { LandingSceneManifest } from '@/lib/landing/scenes/sceneTypes'
import { useLandingRuntimeSelector, type LandingRuntimeStore } from '@/lib/landing/runtime/runtimeStore'

type LandingStageProps = {
  manifest: LandingSceneManifest
  store: LandingRuntimeStore
  mediaHostRef: (element: HTMLDivElement | null) => void
}

export function LandingStage({
  manifest,
  store,
  mediaHostRef,
}: LandingStageProps) {
  const activeSegmentId = useLandingRuntimeSelector(store, (state) => state.motion.activeSegmentId)
  const media = useLandingRuntimeSelector(store, (state) => state.media)
  const readiness = useLandingRuntimeSelector(store, (state) => state.readiness.activeAssetReadyState)
  const tierSnapshot = useLandingRuntimeSelector(store, (state) => state.tierSnapshot)
  const performanceBudget = useLandingRuntimeSelector(store, (state) => state.performanceBudget)
  const mountStrategy = useLandingRuntimeSelector(
    store,
    (state) => state.motionPolicy?.mountStrategy ?? 'active-neighbors'
  )
  const visibleSegments = getVisibleLandingSegments(
    manifest,
    activeSegmentId,
    mountStrategy === 'active-only' ? 0 : 1
  )
  const activeIndex = visibleSegments.findIndex((segment) => segment.id === activeSegmentId)
  const resolvedActiveIndex = activeIndex === -1 ? 0 : activeIndex
  const visualTier = tierSnapshot?.tier ?? 'tier-1-hold'
  const prefersReducedMotion = tierSnapshot?.prefersReducedMotion ?? false
  const allowPremiumEffects = performanceBudget?.allowPremiumEffects ?? false

  return (
    <div
      className={styles.stickyStage}
      data-visual-tier={visualTier}
      data-premium-effects={allowPremiumEffects ? 'true' : 'false'}
      data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
    >
      <div className={styles.mediaPlane}>
        <div
          ref={mediaHostRef}
          className={`${styles.mediaHost} ${
            media.activeMode !== 'poster' && readiness !== 'idle' && readiness !== 'failed'
              ? styles.mediaVisible
              : ''
          }`}
          data-media-mode={media.activeMode}
          data-asset-ready={readiness}
          aria-hidden="true"
        />
      </div>

      <div className={styles.continuityLayer} aria-hidden="true">
        <div
          className={styles.posterLayer}
          style={
            media.activePosterSrc
              ? {
                  backgroundImage: `url("${media.activePosterSrc}")`,
                }
              : undefined
          }
        />
        <div className={styles.posterTint} />
      </div>

      <div className={styles.panelLayer}>
        <div className={styles.panelStage}>
          <div className={styles.panelStack}>
            {visibleSegments.map((segment, index) => {
              if (!segment.panelKey) {
                return null
              }

              const isActive = segment.id === activeSegmentId
              const segmentReadyState = segment.media.assetId
                ? media.assetReadiness[segment.media.assetId]
                : undefined
              const position =
                index < resolvedActiveIndex
                  ? 'previous'
                  : index > resolvedActiveIndex
                    ? 'next'
                    : 'current'

              return (
                <LandingPanelFrame
                  key={segment.id}
                  segment={segment}
                  tier={visualTier}
                  allowPremiumEffects={allowPremiumEffects}
                  prefersReducedMotion={prefersReducedMotion}
                  isActive={isActive}
                  position={position}
                  assetReadyState={segmentReadyState}
                />
              )
            })}
          </div>
        </div>
      </div>

      <div className={styles.glassOverlayLayer}>
        <GlassOverlay
          tier={visualTier}
          allowPremiumEffects={allowPremiumEffects}
          className={styles.stageGlassOverlay}
        />
      </div>

      <div className={styles.controlsLayer} aria-hidden="true">
        <div className={styles.panelStack}>
          <div className={styles.stageControlsRail} />
        </div>
      </div>
    </div>
  )
}
