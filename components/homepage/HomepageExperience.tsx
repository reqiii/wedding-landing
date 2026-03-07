'use client'

import { useEffect, useMemo, useState } from 'react'
import { ScrollIndicators } from '@/components/ScrollIndicators'
import { HomepagePreloader } from '@/components/homepage/HomepagePreloader'
import { ScrollStoryScene } from '@/components/sections/ScrollStoryScene'
import { getLandingPreloadAssets, type LandingPreloadAsset } from '@/lib/landingMedia'

const IMAGE_TIMEOUT_MS = 15000
const VIDEO_TIMEOUT_MS = 45000
const PRELOADER_OUTRO_MS = 1100
const SCENE_READY_FALLBACK_MS = 2500

type AssetLoadResult = {
  asset: LandingPreloadAsset
  status: 'loaded' | 'error' | 'timeout'
}

function preloadImage(asset: LandingPreloadAsset): Promise<AssetLoadResult> {
  return new Promise((resolve) => {
    const image = new window.Image()
    let settled = false

    const finish = (status: AssetLoadResult['status']) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      image.onload = null
      image.onerror = null
      resolve({ asset, status })
    }

    const timeoutId = window.setTimeout(() => finish('timeout'), IMAGE_TIMEOUT_MS)

    image.onload = () => finish('loaded')
    image.onerror = () => finish('error')
    image.decoding = 'async'
    image.src = asset.src

    if (image.complete) {
      finish('loaded')
    }
  })
}

function preloadVideo(asset: LandingPreloadAsset): Promise<AssetLoadResult> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    let settled = false

    const cleanup = () => {
      window.clearTimeout(timeoutId)
      video.removeEventListener('loadeddata', handleReady)
      video.removeEventListener('canplaythrough', handleReady)
      video.removeEventListener('error', handleError)
      video.pause()
      video.removeAttribute('src')
      video.load()
    }

    const finish = (status: AssetLoadResult['status']) => {
      if (settled) return
      settled = true
      cleanup()
      resolve({ asset, status })
    }

    const handleReady = () => finish('loaded')
    const handleError = () => finish('error')
    const timeoutId = window.setTimeout(() => finish('timeout'), VIDEO_TIMEOUT_MS)

    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.addEventListener('loadeddata', handleReady)
    video.addEventListener('canplaythrough', handleReady)
    video.addEventListener('error', handleError)
    video.src = asset.src
    video.load()

    if (video.readyState >= 2) {
      finish('loaded')
    }
  })
}

function preloadAsset(asset: LandingPreloadAsset) {
  return asset.kind === 'image' ? preloadImage(asset) : preloadVideo(asset)
}

export function HomepageExperience() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [completedAssets, setCompletedAssets] = useState(0)
  const [failedAssets, setFailedAssets] = useState(0)
  const [preloadComplete, setPreloadComplete] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [isPreloaderExiting, setIsPreloaderExiting] = useState(false)
  const [isPreloaderHidden, setIsPreloaderHidden] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  const preloadAssets = useMemo(
    () => (isMobile === null ? [] : getLandingPreloadAssets(isMobile)),
    [isMobile]
  )

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
    if (isMobile === null) return

    let isCancelled = false
    let resolvedCount = 0

    setCompletedAssets(0)
    setFailedAssets(0)
    setPreloadComplete(false)
    setSceneReady(false)
    setIsPreloaderExiting(false)
    setIsPreloaderHidden(false)

    const run = async () => {
      const results = await Promise.all(
        preloadAssets.map(async (asset) => {
          const result = await preloadAsset(asset)
          resolvedCount += 1

          if (!isCancelled) {
            setCompletedAssets(resolvedCount)
          }

          return result
        })
      )

      if (isCancelled) return

      const failedCount = results.filter((result) => result.status !== 'loaded').length
      if (failedCount > 0) {
        console.warn(
          'Homepage preloader finished with incomplete assets:',
          results
            .filter((result) => result.status !== 'loaded')
            .map((result) => `${result.asset.id}:${result.status}`)
        )
      }

      setFailedAssets(failedCount)
      setPreloadComplete(true)
    }

    run()

    return () => {
      isCancelled = true
    }
  }, [isMobile, preloadAssets])

  useEffect(() => {
    if (!preloadComplete || sceneReady) return

    const fallbackId = window.setTimeout(() => {
      setSceneReady(true)
    }, SCENE_READY_FALLBACK_MS)

    return () => window.clearTimeout(fallbackId)
  }, [preloadComplete, sceneReady])

  useEffect(() => {
    if (!preloadComplete || !sceneReady || isPreloaderExiting) return

    setIsPreloaderExiting(true)
  }, [preloadComplete, sceneReady, isPreloaderExiting])

  useEffect(() => {
    if (!isPreloaderExiting || isPreloaderHidden) return

    const hideId = window.setTimeout(() => {
      setIsPreloaderHidden(true)
    }, PRELOADER_OUTRO_MS)

    return () => window.clearTimeout(hideId)
  }, [isPreloaderExiting, isPreloaderHidden])

  const preloaderLabel = useMemo(() => {
    if (!preloadAssets.length) {
      return 'Пожалуйста, подождите, готовим страницу'
    }

    if (!preloadComplete) {
      return `Пожалуйста, подождите, готовим страницу ${completedAssets}/${preloadAssets.length}`
    }

    if (failedAssets > 0) {
      return 'Материалы почти готовы, открываем страницу'
    }

    return 'Материалы готовы, открываем страницу'
  }, [completedAssets, failedAssets, preloadAssets.length, preloadComplete])

  return (
    <>
      <main className="min-h-screen">
        <ScrollIndicators />
        <ScrollStoryScene onInitialMediaReady={() => setSceneReady(true)} />
      </main>

      {!isPreloaderHidden ? (
        <HomepagePreloader isExiting={isPreloaderExiting} label={preloaderLabel} />
      ) : null}
    </>
  )
}
