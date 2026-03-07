'use client'

import { useOptionalLandingRuntime } from '@/components/homepage/LandingRuntimeProvider'
import styles from './HomepagePreloader.module.css'

type HomepagePreloaderProps = {
  isExiting?: boolean
  label?: string
}

export function HomepagePreloader({
  isExiting = false,
  label = 'Пожалуйста, подождите, готовим страницу',
}: HomepagePreloaderProps) {
  const runtime = useOptionalLandingRuntime()
  const simplified = runtime ? !runtime.policy.allowAmbientPreloader : false

  return (
    <div
      className={`${styles.preloader} ${isExiting ? styles.isOutro : ''} ${
        simplified ? styles.isSimplified : ''
      }`}
      role="status"
      aria-live="polite"
      aria-busy={!isExiting}
    >
      <div className={styles.inner}>
        <div className={styles.logoStage} aria-hidden="true">
          <div className={styles.logoStatic} />
          <div className={styles.logoGlow} />
          <div className={styles.logoShimmer} />
        </div>

        <p className={styles.label}>{label}</p>
      </div>
    </div>
  )
}
