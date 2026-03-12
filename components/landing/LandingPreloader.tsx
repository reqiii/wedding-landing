'use client'

import styles from '@/components/landing/LandingShell.module.css'
import { cn } from '@/lib/utils'

type LandingPreloaderProps = {
  visible: boolean
  label: string
  tierLabel: string
}

export function LandingPreloader({
  visible,
  label,
  tierLabel,
}: LandingPreloaderProps) {
  return (
    <div className={cn(styles.preloader, !visible && styles.preloaderHidden)}>
      <div className={styles.preloaderCard}>
        <div className="mb-3 text-xs uppercase tracking-[0.28em] text-white/55">{tierLabel}</div>
        <div className="mb-4 font-display text-3xl text-white">Cinematic landing runtime</div>
        <p className="mb-6 text-sm leading-6 text-white/72">{label}</p>
        <div className={styles.preloaderBar}>
          <div className={styles.preloaderBarFill} />
        </div>
      </div>
    </div>
  )
}
