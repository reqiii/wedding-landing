import { writeCssNumber } from '@/lib/landing/runtime/cssVarWriter'
import { computeSceneState, measureScene, type RegisteredScene, type SceneMeasurement } from '@/lib/landing/runtime/sceneRegistry'
import { createScrollFrameMonitor } from '@/lib/landing/telemetry/scrollFrameMonitor'

type EngineOptions = {
  onDocumentProgress?: (progress: number) => void
  onScrollFrame?: (duration: number) => void
}

export function createScrollEngine<TSegmentId extends string>(options: EngineOptions = {}) {
  const registrations = new Map<string, RegisteredScene<TSegmentId>>()
  const measurements = new Map<string, SceneMeasurement<TSegmentId>>()
  const cssCache = new WeakMap<HTMLElement, Map<string, string>>()
  const scrollFrameMonitor = createScrollFrameMonitor((sample) => {
    options.onScrollFrame?.(sample.duration)
  })

  let rafId = 0
  let started = false

  const getElementCache = (element: HTMLElement) => {
    let cache = cssCache.get(element)
    if (!cache) {
      cache = new Map<string, string>()
      cssCache.set(element, cache)
    }
    return cache
  }

  const applySceneState = (sceneId: string, scrollY: number) => {
    const measurement = measurements.get(sceneId)
    if (!measurement) return

    const state = computeSceneState(measurement, scrollY)
    const cache = getElementCache(measurement.element)

    writeCssNumber(measurement.element, '--scene-progress', state.sceneProgress, cache)
    writeCssNumber(measurement.element, '--scene-active', state.active ? 1 : 0, cache)

    for (const [segmentId, segmentProgress] of Object.entries(state.segmentProgressById) as Array<
      [string, number]
    >) {
      writeCssNumber(
        measurement.element,
        `--segment-progress-${segmentId}`,
        segmentProgress,
        cache
      )
    }

    if (measurement.active !== state.active) {
      measurement.active = state.active
      measurement.element.dataset.sceneActive = state.active ? 'true' : 'false'
      measurement.onActiveChange?.(state.active)
    }

    if (measurement.activeSegmentId !== state.activeSegmentId) {
      measurement.activeSegmentId = state.activeSegmentId
      measurement.element.dataset.activeSegment = state.activeSegmentId
      measurement.onActiveSegmentChange?.(state.activeSegmentId)
    }

    measurement.onStateChange?.(state)
  }

  const update = () => {
    rafId = 0
    scrollFrameMonitor.measure(() => {
      const scrollElement = document.scrollingElement ?? document.documentElement ?? document.body
      const scrollY = Math.max(window.scrollY, scrollElement.scrollTop, document.body.scrollTop)
      const viewportH = window.innerHeight || 0
      const total = Math.max(1, scrollElement.scrollHeight - viewportH)

      options.onDocumentProgress?.(scrollY / total)
      measurements.forEach((_measurement, sceneId) => applySceneState(sceneId, scrollY))
    })
  }

  const queueUpdate = () => {
    if (rafId) return
    rafId = window.requestAnimationFrame(update)
  }

  const remeasure = () => {
    registrations.forEach((registration, id) => {
      measurements.set(id, measureScene(registration))
    })
    queueUpdate()
  }

  const start = () => {
    if (started) return
    started = true
    window.addEventListener('scroll', queueUpdate, { passive: true })
    window.addEventListener('resize', remeasure)
    queueUpdate()
  }

  const stop = () => {
    if (!started) return
    started = false
    window.removeEventListener('scroll', queueUpdate)
    window.removeEventListener('resize', remeasure)
    if (rafId) {
      window.cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  return {
    register(scene: RegisteredScene<TSegmentId>) {
      registrations.set(scene.id, scene)
      measurements.set(scene.id, measureScene(scene))
      start()
      queueUpdate()

      return () => {
        registrations.delete(scene.id)
        measurements.delete(scene.id)
        if (registrations.size === 0) {
          stop()
        }
      }
    },
    remeasure,
    destroy() {
      stop()
      registrations.clear()
      measurements.clear()
    },
  }
}
