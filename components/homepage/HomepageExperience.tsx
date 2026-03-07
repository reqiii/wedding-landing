'use client'

import { useEffect, useMemo, useState } from 'react'
import { ScrollIndicators } from '@/components/ScrollIndicators'
import { HomepagePreloader } from '@/components/homepage/HomepagePreloader'
import { useLandingAssetStore } from '@/components/homepage/hooks/useLandingAssetStore'
import { useLandingPlaybackPolicy } from '@/components/homepage/hooks/useLandingPlaybackPolicy'
import { useSegmentWarmup } from '@/components/homepage/hooks/useSegmentWarmup'
import { ScrollStoryScene } from '@/components/sections/ScrollStoryScene'
import type { LandingSegmentId } from '@/lib/landing/mediaManifest'
import { getBackgroundImmediateLandingAssetIds } from '@/lib/landing/preloadPolicy'

const PRELOADER_OUTRO_MS = 1100
const SCENE_READY_FALLBACK_MS = 2500

export function HomepageExperience() {
  const { deviceProfile, isMobileSafari } = useLandingPlaybackPolicy()
  const { assets, criticalProgress, criticalComplete, criticalReady, ensureCritical, warmAssets } =
    useLandingAssetStore(deviceProfile, {
      useNativeStrictVideo: isMobileSafari,
    })
  const [sceneReady, setSceneReady] = useState(false)
  const [isPreloaderExiting, setIsPreloaderExiting] = useState(false)
  const [isPreloaderHidden, setIsPreloaderHidden] = useState(false)
  const [activeSegmentId, setActiveSegmentId] = useState<LandingSegmentId | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = isPreloaderHidden ? '' : 'hidden'
    document.documentElement.style.overflow = isPreloaderHidden ? '' : 'hidden'

    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [isPreloaderHidden])

  useEffect(() => {
    if (!deviceProfile) return
    setSceneReady(false)
    setIsPreloaderExiting(false)
    setIsPreloaderHidden(false)
    setActiveSegmentId(null)
    ensureCritical().catch(() => undefined)
  }, [deviceProfile, ensureCritical])

  useEffect(() => {
    if (!isPreloaderHidden) return
    warmAssets(getBackgroundImmediateLandingAssetIds()).catch(() => undefined)
  }, [isPreloaderHidden, warmAssets])

  useSegmentWarmup({
    activeSegmentId,
    enabled: isPreloaderHidden,
    warmAssets,
  })

  useEffect(() => {
    if (!criticalReady || sceneReady) return

    const fallbackId = window.setTimeout(() => {
      setSceneReady(true)
    }, SCENE_READY_FALLBACK_MS)

    return () => window.clearTimeout(fallbackId)
  }, [criticalReady, sceneReady])

  useEffect(() => {
    if (!criticalComplete || !sceneReady || isPreloaderExiting) return

    setIsPreloaderExiting(true)
  }, [criticalComplete, sceneReady, isPreloaderExiting])

  useEffect(() => {
    if (!isPreloaderExiting || isPreloaderHidden) return

    const hideId = window.setTimeout(() => {
      setIsPreloaderHidden(true)
    }, PRELOADER_OUTRO_MS)

    return () => window.clearTimeout(hideId)
  }, [isPreloaderExiting, isPreloaderHidden])

  const preloaderLabel = useMemo(() => {
    if (!criticalProgress.total) {
      return 'Пожалуйста, подождите, готовим страницу'
    }

    if (!criticalComplete) {
      return `Пожалуйста, подождите, готовим первую сцену ${criticalProgress.completed}/${criticalProgress.total}`
    }

    if (!criticalReady || criticalProgress.failed > 0) {
      return 'Открываем страницу, остальное догрузится в фоне'
    }

    return 'Первая сцена готова, открываем страницу'
  }, [
    criticalComplete,
    criticalProgress.completed,
    criticalProgress.failed,
    criticalProgress.total,
    criticalReady,
  ])

  return (
    <>
      <main className="min-h-screen">
        <ScrollIndicators />
        {assets ? (
          <ScrollStoryScene
            assets={assets}
            onInitialMediaReady={() => setSceneReady(true)}
            onSegmentChange={setActiveSegmentId}
          />
        ) : null}
      </main>

      {!isPreloaderHidden ? (
        <HomepagePreloader isExiting={isPreloaderExiting} label={preloaderLabel} />
      ) : null}
    </>
  )
}
