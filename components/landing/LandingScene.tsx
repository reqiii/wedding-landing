'use client'

import { useCallback, useEffect, useRef } from 'react'
import styles from '@/components/landing/LandingShell.module.css'
import { LandingStage } from '@/components/landing/LandingStage'
import type { LandingBootstrap } from '@/lib/landing/runtime/landingBootstrap'
import type { LandingSceneManifest } from '@/lib/landing/scenes/sceneTypes'

type LandingSceneProps = {
  bootstrap: LandingBootstrap
  manifest: LandingSceneManifest
}

export function LandingScene({
  bootstrap,
  manifest,
}: LandingSceneProps) {
  const sceneRootRef = useRef<HTMLDivElement | null>(null)
  const mediaHostRef = useRef<HTMLDivElement | null>(null)
  const setMediaHostRef = useCallback((element: HTMLDivElement | null) => {
    mediaHostRef.current = element
  }, [])

  useEffect(() => {
    const sceneRoot = sceneRootRef.current
    if (!sceneRoot) {
      return
    }

    const detachScene = bootstrap.mountScene(sceneRoot)
    return () => {
      detachScene()
    }
  }, [bootstrap])

  useEffect(() => {
    return bootstrap.attachMediaHost(mediaHostRef.current)
  }, [bootstrap])

  return (
    <section ref={sceneRootRef} className={styles.sceneRoot} data-scene-id={manifest.id}>
      <LandingStage manifest={manifest} store={bootstrap.store} mediaHostRef={setMediaHostRef} />
      <div className={styles.scrollTrack} aria-hidden="true">
        {manifest.segments.map((segment) => (
          <div
            key={segment.id}
            className={styles.scrollSegment}
            data-segment-id={segment.id}
            style={{ minHeight: `${segment.lengthVh}svh` }}
          />
        ))}
      </div>
    </section>
  )
}
