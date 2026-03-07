'use client'

import styles from './HomepagePreloader.module.css'

type HomepagePreloaderProps = {
  isExiting?: boolean
  label?: string
}

export function HomepagePreloader({
  isExiting = false,
  label = 'Пожалуйста, подождите, готовим страницу',
}: HomepagePreloaderProps) {
  return (
    <div
      className={`${styles.preloader} ${isExiting ? styles.isOutro : ''}`}
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
