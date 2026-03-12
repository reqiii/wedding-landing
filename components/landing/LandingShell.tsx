'use client'

import { useEffect, useRef } from 'react'
import styles from '@/components/landing/LandingShell.module.css'
import { LandingPreloader } from '@/components/landing/LandingPreloader'
import { LandingScene } from '@/components/landing/LandingScene'
import { LANDING_SCENE_MANIFEST } from '@/lib/landing/scenes/sceneManifest'
import { createLandingBootstrap } from '@/lib/landing/runtime/landingBootstrap'
import { useLandingRuntimeSelector } from '@/lib/landing/runtime/runtimeStore'

const TIER_LABEL: Record<string, string> = {
  'tier-0-poster': 'tier 0 poster',
  'tier-1-hold': 'tier 1 hold',
  'tier-2-balanced': 'tier 2 balanced',
  'tier-3-premium': 'tier 3 premium',
}

export function LandingShell() {
  const bootstrapRef = useRef<ReturnType<typeof createLandingBootstrap> | null>(null)
  if (!bootstrapRef.current) {
    bootstrapRef.current = createLandingBootstrap(LANDING_SCENE_MANIFEST)
  }

  const bootstrap = bootstrapRef.current
  const readiness = useLandingRuntimeSelector(bootstrap.store, (state) => state.readiness.bootstrap)
  const tier = useLandingRuntimeSelector(bootstrap.store, (state) => state.tierSnapshot?.tier ?? null)

  useEffect(() => {
    void bootstrap.initialize()

    return () => {
      bootstrap.destroy()
    }
  }, [bootstrap])

  const tierLabel = tier ? TIER_LABEL[tier] : 'resolving tier'
  const preloaderLabel =
    readiness === 'ready'
      ? 'Foundation is warm. Handing control over to the landing shell.'
      : 'Resolving runtime tier, manifest, and critical media readiness for the first reveal.'

  return (
    <main className={styles.shell} data-tier={tier ?? 'booting'}>
      <LandingScene bootstrap={bootstrap} manifest={LANDING_SCENE_MANIFEST} />
      <LandingPreloader
        visible={readiness !== 'ready'}
        label={preloaderLabel}
        tierLabel={tierLabel}
      />
    </main>
  )
}
