'use client'

import { useEffect, useRef } from 'react'
import styles from '@/components/landing/LandingShell.module.css'
import { LandingPanelFrame } from '@/components/landing/panels/LandingPanelFrame'
import { GlassOverlay } from '@/components/landing/ui/GlassPanel'
import {
  getMountedLandingPanelSegments,
  getResolvedLandingContentSegment,
} from '@/lib/landing/scenes/sceneSelectors'
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
  const stageRef = useRef<HTMLDivElement | null>(null)
  const activeSegmentId = useLandingRuntimeSelector(store, (state) => state.motion.activeSegmentId)
  const activeMode = useLandingRuntimeSelector(store, (state) => state.media.activeMode)
  const activePosterSrc = useLandingRuntimeSelector(store, (state) => state.media.activePosterSrc)
  const assetReadiness = useLandingRuntimeSelector(store, (state) => state.media.assetReadiness)
  const readiness = useLandingRuntimeSelector(store, (state) => state.readiness.activeAssetReadyState)
  const tierSnapshot = useLandingRuntimeSelector(store, (state) => state.tierSnapshot)
  const performanceBudget = useLandingRuntimeSelector(store, (state) => state.performanceBudget)
  const mountStrategy = useLandingRuntimeSelector(
    store,
    (state) => state.motionPolicy?.mountStrategy ?? 'active-neighbors'
  )
  const resolvedActiveSegment = getResolvedLandingContentSegment(
    manifest,
    activeSegmentId
  )
  const mountedPanelSegments = getMountedLandingPanelSegments(
    manifest,
    activeSegmentId,
    mountStrategy !== 'active-only'
  )
  const renderedPanelSegments =
    mountedPanelSegments.length > 0
      ? mountedPanelSegments
      : resolvedActiveSegment
        ? [resolvedActiveSegment]
        : []
  const visualTier = tierSnapshot?.tier ?? 'tier-1-hold'
  const prefersReducedMotion = tierSnapshot?.prefersReducedMotion ?? false
  const allowPremiumEffects = performanceBudget?.allowPremiumEffects ?? false
  const mountedPanelCount = renderedPanelSegments.length
  const showContinuityLayer =
    activeMode === 'poster' || readiness === 'idle' || readiness === 'failed'
  const activePanelKey = resolvedActiveSegment?.panelKey ?? null
  const isRsvpPosterContinuity = activePanelKey === 'rsvp' && showContinuityLayer
  const showStageOverlay = visualTier === 'tier-2-balanced' || allowPremiumEffects
  const showControlsRail = showStageOverlay && !prefersReducedMotion

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) {
      return
    }

    const stageNodeCount = stage.querySelectorAll('*').length
    store.patch({
      debug: {
        performance: {
          runtime: {
            mountedPanelCount,
            stageNodeCount,
          },
        },
      },
    })
  }, [mountedPanelCount, activeSegmentId, showControlsRail, showStageOverlay, store])

  return (
    <div
      ref={stageRef}
      className={styles.stickyStage}
      data-active-panel={activePanelKey ?? 'none'}
      data-visual-tier={visualTier}
      data-continuity-state={showContinuityLayer ? 'poster' : 'video'}
      data-rsvp-poster-continuity={isRsvpPosterContinuity ? 'true' : 'false'}
      data-premium-effects={allowPremiumEffects ? 'true' : 'false'}
      data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
    >
      <div className={styles.mediaPlane}>
        <div
          ref={mediaHostRef}
          className={`${styles.mediaHost} ${
            activeMode !== 'poster' && readiness !== 'idle' && readiness !== 'failed'
              ? styles.mediaVisible
              : ''
          }`}
          data-media-mode={activeMode}
          data-asset-ready={readiness}
          aria-hidden="true"
        />
      </div>

      {showContinuityLayer && activePosterSrc ? (
        <div className={styles.continuityLayer} aria-hidden="true">
          <div
            className={styles.posterLayer}
            style={{
              backgroundImage: `url("${activePosterSrc}")`,
            }}
          />
          <div className={styles.posterTint} />
        </div>
      ) : null}

      <div className={styles.panelLayer}>
        <div className={styles.panelStage}>
          <div className={styles.panelStack}>
            {renderedPanelSegments.map((segment, index) => {
              const isActive = segment.id === resolvedActiveSegment?.id
              const segmentReadyState = segment.media.assetId
                ? assetReadiness[segment.media.assetId]
                : undefined
              const position = index === 0 ? 'current' : 'next'

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

      {showStageOverlay ? (
        <div className={styles.glassOverlayLayer}>
          <GlassOverlay
            tier={visualTier}
            allowPremiumEffects={allowPremiumEffects}
            className={styles.stageGlassOverlay}
          />
        </div>
      ) : null}

      <div
        className={styles.controlsLayer}
        aria-hidden="true"
        data-visible={showControlsRail ? 'true' : 'false'}
      >
        <div className={styles.panelStack}>
          <div className={styles.stageControlsRail} />
        </div>
      </div>
    </div>
  )
}
