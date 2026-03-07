'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ScrollIndicators } from '@/components/ScrollIndicators'
import { HomepagePreloader } from '@/components/homepage/HomepagePreloader'
import { ScrollStoryScene } from '@/components/sections/ScrollStoryScene'
import {
  getBackgroundLandingPreloadAssets,
  getCriticalLandingPreloadAssets,
  type LandingPreloadAsset,
} from '@/lib/landingMedia'

const IMAGE_TIMEOUT_MS = 15000
const VIDEO_TIMEOUT_MS = 45000
const PRELOADER_OUTRO_MS = 1100
const SCENE_READY_FALLBACK_MS = 2500

type AssetLoadResult = {
  asset: LandingPreloadAsset
  status: 'loaded' | 'error' | 'timeout'
}

type StrictAssetLoadResult = AssetLoadResult & {
  resolvedSrc?: string
}

type AssetSourceOverrides = Record<string, string>

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

async function strictPreloadAsset(asset: LandingPreloadAsset): Promise<StrictAssetLoadResult> {
  if (asset.kind === 'image') {
    return preloadImage(asset)
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort('timeout'), VIDEO_TIMEOUT_MS)

  try {
    const response = await fetch(asset.src, {
      signal: controller.signal,
      cache: 'force-cache',
    })

    if (!response.ok) {
      return { asset, status: 'error' }
    }

    const blob = await response.blob()
    return {
      asset,
      status: 'loaded',
      resolvedSrc: URL.createObjectURL(blob),
    }
  } catch (error) {
    return {
      asset,
      status: error instanceof DOMException && error.name === 'AbortError' ? 'timeout' : 'error',
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export function HomepageExperience() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [completedAssets, setCompletedAssets] = useState(0)
  const [failedAssets, setFailedAssets] = useState(0)
  const [criticalPreloadComplete, setCriticalPreloadComplete] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [isPreloaderExiting, setIsPreloaderExiting] = useState(false)
  const [isPreloaderHidden, setIsPreloaderHidden] = useState(false)
  const [sourceOverrides, setSourceOverrides] = useState<AssetSourceOverrides>({})
  const objectUrlsRef = useRef<string[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  const criticalPreloadAssets = useMemo(
    () => (isMobile === null ? [] : getCriticalLandingPreloadAssets(isMobile)),
    [isMobile]
  )

  const backgroundPreloadAssets = useMemo(
    () => (isMobile === null ? [] : getBackgroundLandingPreloadAssets(isMobile)),
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
    setCriticalPreloadComplete(false)
    setSceneReady(false)
    setIsPreloaderExiting(false)
    setIsPreloaderHidden(false)
    setSourceOverrides({})

    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    objectUrlsRef.current = []

    const run = async () => {
      const results = await Promise.all(
        criticalPreloadAssets.map(async (asset) => {
          const result = await strictPreloadAsset(asset)
          resolvedCount += 1

          if (!isCancelled) {
            setCompletedAssets(resolvedCount)
          }

          return result
        })
      )

      if (isCancelled) return

      const failedCount = results.filter((result) => result.status !== 'loaded').length
      const nextOverrides: AssetSourceOverrides = {}

      results.forEach((result) => {
        if (result.status === 'loaded' && result.resolvedSrc) {
          nextOverrides[result.asset.src] = result.resolvedSrc
          objectUrlsRef.current.push(result.resolvedSrc)
        }
      })

      if (failedCount > 0) {
        console.warn(
          'Homepage critical preloader finished with incomplete assets:',
          results
            .filter((result) => result.status !== 'loaded')
            .map((result) => `${result.asset.id}:${result.status}`)
        )
      }

      setSourceOverrides(nextOverrides)
      setFailedAssets(failedCount)
      setCriticalPreloadComplete(true)
    }

    run()

    return () => {
      isCancelled = true
    }
  }, [criticalPreloadAssets, isMobile])

  useEffect(() => {
    if (isMobile === null || !criticalPreloadComplete) return

    let isCancelled = false

    const warmRemainingAssets = async () => {
      const results = await Promise.all(backgroundPreloadAssets.map((asset) => preloadAsset(asset)))

      if (isCancelled) return

      const failed = results.filter((result) => result.status !== 'loaded')
      if (failed.length > 0) {
        console.warn(
          'Homepage background preload finished with incomplete assets:',
          failed.map((result) => `${result.asset.id}:${result.status}`)
        )
      }
    }

    warmRemainingAssets()

    return () => {
      isCancelled = true
    }
  }, [backgroundPreloadAssets, criticalPreloadComplete, isMobile])

  useEffect(() => {
    if (!criticalPreloadComplete || sceneReady) return

    const fallbackId = window.setTimeout(() => {
      setSceneReady(true)
    }, SCENE_READY_FALLBACK_MS)

    return () => window.clearTimeout(fallbackId)
  }, [criticalPreloadComplete, sceneReady])

  useEffect(() => {
    if (!criticalPreloadComplete || !sceneReady || isPreloaderExiting) return

    setIsPreloaderExiting(true)
  }, [criticalPreloadComplete, sceneReady, isPreloaderExiting])

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current = []
    }
  }, [])

  useEffect(() => {
    if (!isPreloaderExiting || isPreloaderHidden) return

    const hideId = window.setTimeout(() => {
      setIsPreloaderHidden(true)
    }, PRELOADER_OUTRO_MS)

    return () => window.clearTimeout(hideId)
  }, [isPreloaderExiting, isPreloaderHidden])

  const preloaderLabel = useMemo(() => {
    if (!criticalPreloadAssets.length) {
      return 'Пожалуйста, подождите, готовим страницу'
    }

    if (!criticalPreloadComplete) {
      return `Пожалуйста, подождите, готовим первую сцену ${completedAssets}/${criticalPreloadAssets.length}`
    }

    if (failedAssets > 0) {
      return 'Открываем страницу, остальное догрузится в фоне'
    }

    return 'Первая сцена готова, открываем страницу'
  }, [completedAssets, criticalPreloadAssets.length, criticalPreloadComplete, failedAssets])

  return (
    <>
      <main className="min-h-screen">
        <ScrollIndicators />
        <ScrollStoryScene
          onInitialMediaReady={() => setSceneReady(true)}
          sourceOverrides={sourceOverrides}
        />
      </main>

      {!isPreloaderHidden ? (
        <HomepagePreloader isExiting={isPreloaderExiting} label={preloaderLabel} />
      ) : null}
    </>
  )
}
