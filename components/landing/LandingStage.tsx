'use client'

import type { RefObject } from 'react'
import styles from '@/components/landing/LandingShell.module.css'
import { getLandingPanelComponent } from '@/components/landing/panels/panelRegistry'
import { getVisibleLandingSegments } from '@/lib/landing/scenes/sceneSelectors'
import type { LandingSceneManifest } from '@/lib/landing/scenes/sceneTypes'
import { useLandingRuntimeSelector, type LandingRuntimeStore } from '@/lib/landing/runtime/runtimeStore'

type LandingStageProps = {
  manifest: LandingSceneManifest
  store: LandingRuntimeStore
  videoRef: RefObject<HTMLVideoElement>
}

export function LandingStage({
  manifest,
  store,
  videoRef,
}: LandingStageProps) {
  const activeSegmentId = useLandingRuntimeSelector(store, (state) => state.motion.activeSegmentId)
  const media = useLandingRuntimeSelector(store, (state) => state.media)
  const readiness = useLandingRuntimeSelector(store, (state) => state.readiness.activeAssetReadyState)
  const mountStrategy = useLandingRuntimeSelector(
    store,
    (state) => state.motionPolicy?.mountStrategy ?? 'active-neighbors'
  )
  const visibleSegments = getVisibleLandingSegments(
    manifest,
    activeSegmentId,
    mountStrategy === 'active-only' ? 0 : 1
  )

  return (
    <div className={styles.stickyStage}>
      <div className={styles.mediaLayer}>
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
        <div className={styles.posterTint} aria-hidden="true" />
        <video
          ref={videoRef}
          className={`${styles.videoLayer} ${
            media.activeMode !== 'poster' && readiness !== 'idle' && readiness !== 'failed'
              ? styles.videoVisible
              : ''
          }`}
          muted
          playsInline
        />
      </div>

      <div className={styles.panelStage}>
        <div className={styles.panelStack}>
          {visibleSegments.map((segment) => {
            if (!segment.panelKey) {
              return null
            }

            const Panel = getLandingPanelComponent(segment.panelKey)
            const isActive = segment.id === activeSegmentId
            const segmentReadyState = segment.media.assetId
              ? media.assetReadiness[segment.media.assetId]
              : undefined

            return (
              <div
                key={segment.id}
                className={styles.panelFrame}
                data-active={isActive ? 'true' : 'false'}
                data-nearby="true"
                data-motion={segment.motionPreset}
                data-theme={segment.theme}
                data-asset-ready={segmentReadyState ?? 'idle'}
                style={
                  {
                    ['--landing-segment-progress' as string]: `var(--segment-progress-${segment.id}, var(--landing-segment-progress, 0))`,
                  }
                }
              >
                <div className={styles.panelMotion}>
                  <Panel segment={segment} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
