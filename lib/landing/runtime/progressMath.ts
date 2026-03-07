export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export const lerp = (from: number, to: number, t: number) => from + (to - from) * t

export type SceneProgressRange<TSegmentId extends string> = {
  id: TSegmentId
  start: number
  end: number
}

export function createSceneRanges<TSegmentId extends string>(
  segments: Array<{ id: TSegmentId; lengthVh: number }>
): SceneProgressRange<TSegmentId>[] {
  const total = segments.reduce((sum, segment) => sum + segment.lengthVh, 0)
  let cursor = 0

  return segments.map((segment) => {
    const start = cursor / total
    cursor += segment.lengthVh
    return {
      id: segment.id,
      start,
      end: cursor / total,
    }
  })
}

export function getSegmentProgress(
  sceneProgress: number,
  range: SceneProgressRange<string>
): number {
  return clamp((sceneProgress - range.start) / Math.max(0.0001, range.end - range.start))
}
