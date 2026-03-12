import type { LandingMediaController } from '@/lib/landing/media/mediaController'
import type { LandingWarmupCoordinator } from '@/lib/landing/runtime/warmupCoordinator'
import { getInitialLandingSegment } from '@/lib/landing/scenes/sceneSelectors'
import type {
  LandingSceneId,
  LandingSceneManifest,
  LandingSegmentConfig,
  LandingSegmentId,
} from '@/lib/landing/scenes/sceneTypes'
import { clamp, createSceneRanges } from '@/lib/landing/runtime/progressMath'
import type { LandingRuntimeStore } from '@/lib/landing/runtime/runtimeStore'
import type { LandingMotionPolicy } from '@/lib/landing/tier/tierTypes'

type LandingMotionSystemOptions = {
  sceneManifest: LandingSceneManifest
  mediaController: LandingMediaController
  runtimeStore: LandingRuntimeStore
  warmupCoordinator: LandingWarmupCoordinator
}

export type LandingMotionSystem = {
  mount: (sceneRoot: HTMLElement) => () => void
  destroy: () => void
}

type SegmentRuntime = {
  id: LandingSegmentId
  config: LandingSegmentConfig
  start: number
  end: number
  span: number
  hysteresis: number
  cssVariableName: string
  lastCssValue: number
}

type SceneRuntime = {
  id: LandingSceneId
  root: HTMLElement | null
  segments: SegmentRuntime[]
  top: number
  height: number
  startPx: number
  endPx: number
  total: number
  active: boolean
  activeSegmentIndex: number
  lastScrollProgressCss: number
  lastSceneProgressCss: number
  lastSegmentProgressCss: number
  lastWindowStart: number
  lastWindowEnd: number
  lastMediaProgress: number
}

const ROOT_SCROLL_PROGRESS_VAR = '--landing-scroll-progress'
const ROOT_SCENE_PROGRESS_VAR = '--landing-scene-progress'
const ROOT_SEGMENT_PROGRESS_VAR = '--landing-segment-progress'
const SCENE_ACTIVE_DATASET_KEY = 'sceneActive'
const ACTIVE_SCENE_DATASET_KEY = 'activeScene'
const ACTIVE_SEGMENT_DATASET_KEY = 'activeSegment'
const ROOT_PROGRESS_EPSILON = 0.001
const SEGMENT_PROGRESS_EPSILON = 0.001
const HYSTERESIS_MIN = 0.01
const HYSTERESIS_MAX = 0.04

const DEFAULT_MOTION_POLICY: LandingMotionPolicy = {
  tier: 'tier-1-hold',
  mountStrategy: 'active-neighbors',
  scrubMode: 'off',
  writeCssVariables: true,
}

function getSegmentHysteresis(span: number) {
  return Math.min(HYSTERESIS_MAX, Math.max(HYSTERESIS_MIN, span * 0.18))
}

function createSceneRuntime(sceneManifest: LandingSceneManifest): SceneRuntime {
  const ranges = createSceneRanges(sceneManifest.segments)
  const segments: SegmentRuntime[] = new Array(sceneManifest.segments.length)

  for (let index = 0; index < sceneManifest.segments.length; index += 1) {
    const segment = sceneManifest.segments[index]
    const range = ranges[index]
    const span = Math.max(0.0001, range.end - range.start)
    segments[index] = {
      id: segment.id,
      config: segment,
      start: range.start,
      end: range.end,
      span,
      hysteresis: getSegmentHysteresis(span),
      cssVariableName: `--segment-progress-${segment.id}`,
      lastCssValue: Number.NaN,
    }
  }

  return {
    id: sceneManifest.id,
    root: null,
    segments,
    top: 0,
    height: 0,
    startPx: 0,
    endPx: 0,
    total: 1,
    active: false,
    activeSegmentIndex: 0,
    lastScrollProgressCss: Number.NaN,
    lastSceneProgressCss: Number.NaN,
    lastSegmentProgressCss: Number.NaN,
    lastWindowStart: -1,
    lastWindowEnd: -1,
    lastMediaProgress: Number.NaN,
  }
}

function readScrollY() {
  const scrollElement = document.scrollingElement ?? document.documentElement ?? document.body
  return Math.max(window.scrollY, scrollElement.scrollTop, document.body.scrollTop)
}

function readDocumentProgress(viewportHeight: number) {
  const scrollElement = document.scrollingElement ?? document.documentElement ?? document.body
  const total = Math.max(1, scrollElement.scrollHeight - viewportHeight)
  return clamp(readScrollY() / total)
}

function getWindowRadius(motionPolicy: LandingMotionPolicy) {
  return motionPolicy.mountStrategy === 'active-only' ? 0 : 1
}

function getMediaProgressEpsilon(motionPolicy: LandingMotionPolicy) {
  switch (motionPolicy.scrubMode) {
    case 'full':
      return 0.008
    case 'limited':
      return 0.02
    case 'off':
    default:
      return Number.POSITIVE_INFINITY
  }
}

function writeCssNumber(
  element: HTMLElement,
  variableName: string,
  nextValue: number,
  previousValue: number,
  epsilon: number
) {
  if (!Number.isNaN(previousValue) && Math.abs(previousValue - nextValue) <= epsilon) {
    return previousValue
  }

  element.style.setProperty(variableName, nextValue.toFixed(4))
  return nextValue
}

function removeSceneWindowVariables(scene: SceneRuntime, nextWindowStart: number, nextWindowEnd: number) {
  const root = scene.root
  if (!root) {
    return
  }

  if (scene.lastWindowStart === nextWindowStart && scene.lastWindowEnd === nextWindowEnd) {
    return
  }

  for (let index = 0; index < scene.segments.length; index += 1) {
    const wasVisible =
      scene.lastWindowStart !== -1 && index >= scene.lastWindowStart && index <= scene.lastWindowEnd
    const isVisible = index >= nextWindowStart && index <= nextWindowEnd
    if (!wasVisible || isVisible) {
      continue
    }

    root.style.removeProperty(scene.segments[index].cssVariableName)
    scene.segments[index].lastCssValue = Number.NaN
  }

  scene.lastWindowStart = nextWindowStart
  scene.lastWindowEnd = nextWindowEnd
}

function getRawActiveSegmentIndex(scene: SceneRuntime, sceneProgress: number) {
  for (let index = 0; index < scene.segments.length - 1; index += 1) {
    if (sceneProgress <= scene.segments[index].end) {
      return index
    }
  }

  return scene.segments.length - 1
}

function getStableActiveSegmentIndex(scene: SceneRuntime, sceneProgress: number, direction: number) {
  let nextIndex = scene.activeSegmentIndex
  if (nextIndex < 0 || nextIndex >= scene.segments.length) {
    return getRawActiveSegmentIndex(scene, sceneProgress)
  }

  if (direction > 0) {
    while (
      nextIndex < scene.segments.length - 1 &&
      sceneProgress >= scene.segments[nextIndex].end + scene.segments[nextIndex + 1].hysteresis
    ) {
      nextIndex += 1
    }
    return nextIndex
  }

  if (direction < 0) {
    while (
      nextIndex > 0 &&
      sceneProgress <= scene.segments[nextIndex].start - scene.segments[nextIndex - 1].hysteresis
    ) {
      nextIndex -= 1
    }
    return nextIndex
  }

  const currentSegment = scene.segments[nextIndex]
  if (
    sceneProgress > currentSegment.end + currentSegment.hysteresis ||
    sceneProgress < currentSegment.start - currentSegment.hysteresis
  ) {
    return getRawActiveSegmentIndex(scene, sceneProgress)
  }

  return nextIndex
}

export function createLandingMotionSystem(
  options: LandingMotionSystemOptions
): LandingMotionSystem {
  const { sceneManifest, mediaController, runtimeStore, warmupCoordinator } = options
  const scenes = [createSceneRuntime(sceneManifest)]
  const primaryScene = scenes[0]
  const initialSegment = getInitialLandingSegment(sceneManifest)
  let mounted = false
  let currentScrollY = 0
  let lastProcessedScrollY = 0
  let scrollDirection = 0
  let viewportHeight = 0
  let activeSceneIndex = -1
  let layoutDirty = false
  let framePending = false
  let rafId = 0
  let resizeObserver: ResizeObserver | null = null
  let detachStoreSubscription: (() => void) | null = null
  let lastMotionPolicy = runtimeStore.getState().motionPolicy
  let lastMediaPolicy = runtimeStore.getState().mediaPolicy

  const warmSegmentTargets = (segmentId: LandingSegmentId | null) => {
    const mediaPolicy = runtimeStore.getState().mediaPolicy
    if (!mediaPolicy || mediaPolicy.warmupStrategy === 'none') {
      return
    }

    void warmupCoordinator.warmBoundarySegment(segmentId)
  }

  const getMotionPolicy = () => runtimeStore.getState().motionPolicy ?? DEFAULT_MOTION_POLICY

  const syncSceneMeasurement = (scene: SceneRuntime) => {
    const root = scene.root
    if (!root) {
      return
    }

    const rect = root.getBoundingClientRect()
    scene.top = rect.top + window.scrollY
    scene.height = rect.height
    scene.startPx = viewportHeight * 0.8
    scene.endPx = viewportHeight * 0.2
    scene.total = Math.max(1, scene.height + (scene.startPx - scene.endPx))
  }

  const writeBoundaryDataset = (
    root: HTMLElement,
    sceneId: LandingSceneId | null,
    segmentId: LandingSegmentId,
    isActive: boolean,
    force: boolean
  ) => {
    if (force || root.dataset[SCENE_ACTIVE_DATASET_KEY] !== (isActive ? 'true' : 'false')) {
      root.dataset[SCENE_ACTIVE_DATASET_KEY] = isActive ? 'true' : 'false'
    }

    if (force || root.dataset[ACTIVE_SCENE_DATASET_KEY] !== (sceneId ?? '')) {
      if (sceneId) {
        root.dataset[ACTIVE_SCENE_DATASET_KEY] = sceneId
      } else {
        delete root.dataset[ACTIVE_SCENE_DATASET_KEY]
      }
    }

    if (force || root.dataset[ACTIVE_SEGMENT_DATASET_KEY] !== segmentId) {
      root.dataset[ACTIVE_SEGMENT_DATASET_KEY] = segmentId
    }
  }

  const processFrame = (forceResync: boolean) => {
    framePending = false
    rafId = 0

    if (!mounted || !primaryScene.root) {
      return
    }

    viewportHeight = window.innerHeight || 0
    currentScrollY = readScrollY()

    if (layoutDirty) {
      for (let index = 0; index < scenes.length; index += 1) {
        syncSceneMeasurement(scenes[index])
      }
    }

    if (currentScrollY > lastProcessedScrollY) {
      scrollDirection = 1
    } else if (currentScrollY < lastProcessedScrollY) {
      scrollDirection = -1
    }

    const motionPolicy = getMotionPolicy()
    const windowRadius = getWindowRadius(motionPolicy)
    const documentProgress = readDocumentProgress(viewportHeight)
    let nextActiveSceneIndex = -1
    let boundarySceneId: LandingSceneId | null = null
    let boundarySegmentId = primaryScene.segments[primaryScene.activeSegmentIndex].id
    let boundarySegmentConfig = primaryScene.segments[primaryScene.activeSegmentIndex].config
    let boundaryChanged = false
    let shouldWarmBoundarySegment = false

    for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex += 1) {
      const scene = scenes[sceneIndex]
      const root = scene.root
      if (!root) {
        continue
      }

      const rawSceneProgress = (currentScrollY - scene.top + scene.startPx) / scene.total
      const sceneProgress = clamp(rawSceneProgress)
      const sceneIsActive = rawSceneProgress >= 0 && rawSceneProgress <= 1
      const nextActiveSegmentIndex = getStableActiveSegmentIndex(
        scene,
        sceneProgress,
        scrollDirection
      )
      const activeSegment = scene.segments[nextActiveSegmentIndex]
      const activeSegmentProgress = clamp(
        (sceneProgress - activeSegment.start) / activeSegment.span
      )
      const nearWindowStart = Math.max(0, nextActiveSegmentIndex - windowRadius)
      const nearWindowEnd = Math.min(scene.segments.length - 1, nextActiveSegmentIndex + windowRadius)
      const sceneBoundaryChanged =
        forceResync || scene.active !== sceneIsActive || scene.activeSegmentIndex !== nextActiveSegmentIndex

      if (sceneIsActive && nextActiveSceneIndex === -1) {
        nextActiveSceneIndex = sceneIndex
        boundarySceneId = scene.id
        boundarySegmentId = activeSegment.id
        boundarySegmentConfig = activeSegment.config
        boundaryChanged = sceneBoundaryChanged
        shouldWarmBoundarySegment = sceneBoundaryChanged
      }

      removeSceneWindowVariables(scene, nearWindowStart, nearWindowEnd)

      if (motionPolicy.writeCssVariables) {
        scene.lastScrollProgressCss = writeCssNumber(
          root,
          ROOT_SCROLL_PROGRESS_VAR,
          documentProgress,
          scene.lastScrollProgressCss,
          ROOT_PROGRESS_EPSILON
        )
        scene.lastSceneProgressCss = writeCssNumber(
          root,
          ROOT_SCENE_PROGRESS_VAR,
          sceneProgress,
          scene.lastSceneProgressCss,
          ROOT_PROGRESS_EPSILON
        )
        scene.lastSegmentProgressCss = writeCssNumber(
          root,
          ROOT_SEGMENT_PROGRESS_VAR,
          activeSegmentProgress,
          scene.lastSegmentProgressCss,
          SEGMENT_PROGRESS_EPSILON
        )

        for (let segmentIndex = nearWindowStart; segmentIndex <= nearWindowEnd; segmentIndex += 1) {
          const segment = scene.segments[segmentIndex]
          const segmentProgress = clamp((sceneProgress - segment.start) / segment.span)
          segment.lastCssValue = writeCssNumber(
            root,
            segment.cssVariableName,
            segmentProgress,
            segment.lastCssValue,
            SEGMENT_PROGRESS_EPSILON
          )
        }
      }

      writeBoundaryDataset(root, sceneIsActive ? scene.id : null, activeSegment.id, sceneIsActive, forceResync)

      if (sceneBoundaryChanged) {
        scene.active = sceneIsActive
        scene.activeSegmentIndex = nextActiveSegmentIndex
      }

      if (sceneIsActive && motionPolicy.scrubMode !== 'off') {
        const mediaProgressEpsilon = getMediaProgressEpsilon(motionPolicy)
        if (
          forceResync ||
          sceneBoundaryChanged ||
          Math.abs(scene.lastMediaProgress - activeSegmentProgress) > mediaProgressEpsilon
        ) {
          scene.lastMediaProgress = activeSegmentProgress
          mediaController.syncSegmentProgress(scene.id, activeSegmentProgress)
        }
      }
    }

    if (nextActiveSceneIndex === -1) {
      boundarySegmentId = primaryScene.segments[primaryScene.activeSegmentIndex].id
      boundarySegmentConfig = primaryScene.segments[primaryScene.activeSegmentIndex].config
      boundaryChanged = activeSceneIndex !== -1
    }

    if (forceResync || activeSceneIndex !== nextActiveSceneIndex || boundaryChanged) {
      runtimeStore.setMotionBoundary(boundarySceneId, boundarySegmentId)
      mediaController.activateScene(boundarySceneId)
      mediaController.setActiveSegment(boundarySegmentConfig)

      if (boundarySceneId && shouldWarmBoundarySegment) {
        warmSegmentTargets(boundarySegmentId)
      }
    }

    activeSceneIndex = nextActiveSceneIndex
    lastProcessedScrollY = currentScrollY
    layoutDirty = false
    if (!runtimeStore.getState().readiness.motionReady) {
      runtimeStore.patch({
        readiness: {
          motionReady: true,
        },
      })
    }
  }

  const queueFrame = (forceLayout = false) => {
    if (!mounted) {
      return
    }

    if (forceLayout) {
      layoutDirty = true
    }

    if (framePending) {
      return
    }

    framePending = true
    rafId = window.requestAnimationFrame(() => {
      processFrame(layoutDirty)
    })
  }

  const handleScroll = () => {
    queueFrame(false)
  }

  const handleLayoutInvalidation = () => {
    queueFrame(true)
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      queueFrame(true)
      void warmupCoordinator.refreshActiveSegment()
    }
  }

  const detachRuntime = () => {
    mounted = false
    if (rafId) {
      window.cancelAnimationFrame(rafId)
      rafId = 0
    }
    framePending = false
    resizeObserver?.disconnect()
    resizeObserver = null
    detachStoreSubscription?.()
    detachStoreSubscription = null
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleLayoutInvalidation)
    window.removeEventListener('orientationchange', handleLayoutInvalidation)
    window.removeEventListener('pageshow', handleLayoutInvalidation)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    runtimeStore.patch({
      readiness: {
        motionReady: false,
      },
    })
  }

  return {
    mount(sceneRoot) {
      detachRuntime()

      mounted = true
      primaryScene.root = sceneRoot
      primaryScene.active = false
      primaryScene.activeSegmentIndex = 0
      primaryScene.lastScrollProgressCss = Number.NaN
      primaryScene.lastSceneProgressCss = Number.NaN
      primaryScene.lastSegmentProgressCss = Number.NaN
      primaryScene.lastWindowStart = -1
      primaryScene.lastWindowEnd = -1
      primaryScene.lastMediaProgress = Number.NaN
      currentScrollY = readScrollY()
      lastProcessedScrollY = currentScrollY
      scrollDirection = 0
      viewportHeight = window.innerHeight || 0

      mediaController.setActiveSegment(initialSegment)
      mediaController.activateScene(primaryScene.id)
      runtimeStore.setMotionBoundary(primaryScene.id, initialSegment.id)
      sceneRoot.dataset[ACTIVE_SCENE_DATASET_KEY] = primaryScene.id
      sceneRoot.dataset[ACTIVE_SEGMENT_DATASET_KEY] = initialSegment.id
      sceneRoot.dataset[SCENE_ACTIVE_DATASET_KEY] = 'false'

      window.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener('resize', handleLayoutInvalidation)
      window.addEventListener('orientationchange', handleLayoutInvalidation)
      window.addEventListener('pageshow', handleLayoutInvalidation)
      document.addEventListener('visibilitychange', handleVisibilityChange)

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(handleLayoutInvalidation)
        resizeObserver.observe(sceneRoot)
      }

      detachStoreSubscription = runtimeStore.subscribe(() => {
        const state = runtimeStore.getState()
        if (state.motionPolicy !== lastMotionPolicy || state.mediaPolicy !== lastMediaPolicy) {
          lastMotionPolicy = state.motionPolicy
          lastMediaPolicy = state.mediaPolicy
          handleLayoutInvalidation()
        }
      })

      queueFrame(true)

      return () => {
        if (primaryScene.root !== sceneRoot) {
          return
        }

        sceneRoot.style.removeProperty(ROOT_SCROLL_PROGRESS_VAR)
        sceneRoot.style.removeProperty(ROOT_SCENE_PROGRESS_VAR)
        sceneRoot.style.removeProperty(ROOT_SEGMENT_PROGRESS_VAR)
        for (let index = 0; index < primaryScene.segments.length; index += 1) {
          sceneRoot.style.removeProperty(primaryScene.segments[index].cssVariableName)
        }
        delete sceneRoot.dataset[ACTIVE_SCENE_DATASET_KEY]
        delete sceneRoot.dataset[ACTIVE_SEGMENT_DATASET_KEY]
        delete sceneRoot.dataset[SCENE_ACTIVE_DATASET_KEY]
        primaryScene.root = null
        detachRuntime()
      }
    },
    destroy() {
      primaryScene.root = null
      detachRuntime()
    },
  }
}
