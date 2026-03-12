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
  const tier = useLandingRuntimeSelector(bootstrap.store, (state) => state.tierSnapshot?.tier ?? null)
  const revealState = useLandingRuntimeSelector(bootstrap.store, (state) => state.readiness.revealState)
  const fallbackMode = useLandingRuntimeSelector(bootstrap.store, (state) => state.readiness.fallbackMode)
  const unlockTarget = useLandingRuntimeSelector(bootstrap.store, (state) => state.readiness.unlockTarget)
  const preloaderStage = useLandingRuntimeSelector(bootstrap.store, (state) => state.preloader.stage)
  const preloaderProgress = useLandingRuntimeSelector(bootstrap.store, (state) => state.preloader.progress)

  useEffect(() => {
    void bootstrap.initialize()

    return () => {
      bootstrap.destroy()
    }
  }, [bootstrap])

  const tierLabel = tier ? TIER_LABEL[tier] : 'resolving tier'
  const preloaderLabel =
    revealState === 'failed'
      ? 'Poster-safe reveal could not be confirmed. The runtime is holding on the fallback overlay.'
      : fallbackMode === 'poster'
        ? 'Critical media stalled or degraded. Falling back to a poster-safe reveal contract.'
        : preloaderStage === 'tier'
          ? 'Resolving runtime tier, decoder budget, and mount strategy for the first reveal.'
          : preloaderStage === 'critical-assets'
            ? `Preparing the first scene until ${unlockTarget.replace(/-/g, ' ')} is satisfied.`
            : preloaderStage === 'revealing'
              ? 'Initial visual state is ready. Handing control over to the landing runtime.'
              : 'Bootstrapping the landing runtime for deterministic reveal.'

  return (
    <main
      className={styles.shell}
      data-tier={tier ?? 'booting'}
      data-reveal-state={revealState}
      data-fallback-mode={fallbackMode}
    >
      <LandingScene bootstrap={bootstrap} manifest={LANDING_SCENE_MANIFEST} />
      <LandingPreloader
        visible={revealState !== 'revealed'}
        revealState={revealState}
        stage={preloaderStage}
        progress={preloaderProgress}
        label={preloaderLabel}
        tierLabel={tierLabel}
        fallback={fallbackMode === 'poster'}
      />
    </main>
  )
}
