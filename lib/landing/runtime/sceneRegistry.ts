import { createSceneRanges, getSegmentProgress, type SceneProgressRange } from '@/lib/landing/runtime/progressMath'

export type RegisteredScene<TSegmentId extends string> = {
  id: string
  element: HTMLElement
  segments: Array<{ id: TSegmentId; lengthVh: number }>
  onActiveChange?: (active: boolean) => void
  onActiveSegmentChange?: (segmentId: TSegmentId) => void
  onStateChange?: (state: SceneComputedState<TSegmentId>) => void
}

export type SceneMeasurement<TSegmentId extends string> = {
  element: HTMLElement
  top: number
  height: number
  startPx: number
  endPx: number
  total: number
  active: boolean
  activeSegmentId: TSegmentId
  ranges: SceneProgressRange<TSegmentId>[]
  onActiveChange?: (active: boolean) => void
  onActiveSegmentChange?: (segmentId: TSegmentId) => void
  onStateChange?: (state: SceneComputedState<TSegmentId>) => void
}

export type SceneComputedState<TSegmentId extends string> = {
  active: boolean
  sceneProgress: number
  activeSegmentId: TSegmentId
  segmentProgressById: Record<TSegmentId, number>
}

export function measureScene<TSegmentId extends string>(
  registration: RegisteredScene<TSegmentId>
): SceneMeasurement<TSegmentId> {
  const rect = registration.element.getBoundingClientRect()
  const viewportH = window.innerHeight || 0
  const top = rect.top + window.scrollY
  const height = rect.height
  const startPx = viewportH * 0.8
  const endPx = viewportH * 0.2
  const total = Math.max(1, height + (startPx - endPx))
  const ranges = createSceneRanges(registration.segments)
  const activeSegmentId = ranges[0]?.id ?? registration.segments[0].id

  return {
    element: registration.element,
    top,
    height,
    startPx,
    endPx,
    total,
    active: false,
    activeSegmentId,
    ranges,
    onActiveChange: registration.onActiveChange,
    onActiveSegmentChange: registration.onActiveSegmentChange,
    onStateChange: registration.onStateChange,
  }
}

export function computeSceneState<TSegmentId extends string>(
  measurement: SceneMeasurement<TSegmentId>,
  scrollY: number
) {
  const progressRaw = (scrollY - measurement.top + measurement.startPx) / measurement.total
  const sceneProgress = Math.min(1, Math.max(0, progressRaw))
  const active = progressRaw >= 0 && progressRaw <= 1
  const activeRange =
    measurement.ranges.find((range) => sceneProgress >= range.start && sceneProgress <= range.end) ??
    measurement.ranges[measurement.ranges.length - 1]

  return {
    active,
    sceneProgress,
    activeSegmentId: activeRange.id,
    segmentProgressById: measurement.ranges.reduce<Record<TSegmentId, number>>((acc, range) => {
      acc[range.id] = getSegmentProgress(sceneProgress, range)
      return acc
    }, {} as Record<TSegmentId, number>),
  }
}
