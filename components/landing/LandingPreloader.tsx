'use client'

import styles from '@/components/landing/LandingShell.module.css'
import type {
  LandingPreloaderStage,
  LandingRevealState,
} from '@/lib/landing/runtime/runtimeTypes'
import { cn } from '@/lib/utils'

type LandingPreloaderProps = {
  visible: boolean
  revealState: LandingRevealState
  stage: LandingPreloaderStage
  progress: number
  label: string
  tierLabel: string
  fallback: boolean
}

export function LandingPreloader({
  visible,
  revealState,
  stage,
  progress,
  label,
  tierLabel,
  fallback,
}: LandingPreloaderProps) {
  return (
    <div
      className={cn(
        styles.preloader,
        revealState === 'ready-to-reveal' && styles.preloaderRevealing,
        !visible && styles.preloaderHidden
      )}
      data-stage={stage}
      data-fallback={fallback ? 'true' : 'false'}
    >
      <div className={styles.preloaderCard}>
        <div className={styles.preloaderMeta}>
          <div className="text-xs uppercase tracking-[0.28em] text-white/55">{tierLabel}</div>
          <div className={styles.preloaderStageLabel}>{stage.replace(/-/g, ' ')}</div>
        </div>
        <div className="mb-4 font-display text-3xl text-white">Cinematic landing runtime</div>
        <p className="mb-3 text-sm leading-6 text-white/72">{label}</p>
        <div className={styles.preloaderBar}>
          <div
            className={styles.preloaderBarFill}
            style={{
              transform: `scaleX(${progress.toFixed(3)})`,
            }}
          />
        </div>
        <div className={styles.preloaderProgressValue}>{Math.round(progress * 100)}%</div>
      </div>
    </div>
  )
}
