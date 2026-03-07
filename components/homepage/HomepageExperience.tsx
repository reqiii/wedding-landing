'use client'

import { useEffect, useMemo, useState } from 'react'
import { LandingPerfOverlay } from '@/components/debug/LandingPerfOverlay'
import { LandingRuntimeProvider } from '@/components/homepage/LandingRuntimeProvider'
import { ScrollIndicators } from '@/components/ScrollIndicators'
import { HomepagePreloader } from '@/components/homepage/HomepagePreloader'
import { useLandingAssetStore } from '@/components/homepage/hooks/useLandingAssetStore'
import { useLandingPlaybackPolicy } from '@/components/homepage/hooks/useLandingPlaybackPolicy'
import { useSegmentWarmup } from '@/components/homepage/hooks/useSegmentWarmup'
import { ScrollStoryScene } from '@/components/sections/ScrollStoryScene'
import { getLandingAssetSource, type LandingSegmentId } from '@/lib/landing/mediaManifest'
import { getBackgroundImmediateLandingAssetIds } from '@/lib/landing/preloadPolicy'

const PRELOADER_OUTRO_MS = 700
const SCENE_READY_FALLBACK_MS = 1200

export function HomepageExperience() {
  return (
    <LandingRuntimeProvider heroVideoSrc={getLandingAssetSource('section1', 'desktop')}>
      <HomepageExperienceContent />
    </LandingRuntimeProvider>
  )
}

function HomepageExperienceContent() {
  const { deviceProfile, policy } = useLandingPlaybackPolicy()
  const { assets, criticalProgress, criticalReady, ensureCritical, warmAssets } =
    useLandingAssetStore(deviceProfile, {
      preloadConcurrency: policy.preloadConcurrency,
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
    if (!criticalReady || !sceneReady || isPreloaderExiting) return

    setIsPreloaderExiting(true)
  }, [criticalReady, sceneReady, isPreloaderExiting])

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

    if (!criticalReady) {
      return `Готовим первый экран ${criticalProgress.completed}/${criticalProgress.total}`
    }

    if (criticalProgress.failed > 0) {
      return 'Открываем страницу, тяжелое медиа догрузится в фоне'
    }

    return 'Первый экран готов, открываем страницу'
  }, [
    criticalProgress.completed,
    criticalProgress.failed,
    criticalProgress.total,
    criticalReady,
  ])

  return (
    <>
      <main className="min-h-screen">
        {!policy.simplifiedIndicators ? <ScrollIndicators /> : null}
        {assets ? (
          <ScrollStoryScene
            assets={assets}
            onInitialMediaReady={() => setSceneReady(true)}
            onSegmentChange={setActiveSegmentId}
          />
        ) : null}
      </main>
      <LandingPerfOverlay />

      {!isPreloaderHidden ? (
        <HomepagePreloader isExiting={isPreloaderExiting} label={preloaderLabel} />
      ) : null}
    </>
  )
}
