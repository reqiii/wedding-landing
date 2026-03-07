'use client'

import { useLandingRuntime } from '@/components/homepage/LandingRuntimeProvider'

function formatMetric(value: number | null, suffix = '') {
  if (value === null || Number.isNaN(value)) return '--'
  return `${value.toFixed(1)}${suffix}`
}

export function LandingPerfOverlay() {
  const { debugEnabled, policy, snapshot, telemetry } = useLandingRuntime()

  if (!debugEnabled) {
    return null
  }

  return (
    <aside className="pointer-events-none fixed left-4 top-4 z-[70] max-w-[280px] rounded-xl bg-black/75 px-4 py-3 text-xs text-white shadow-2xl backdrop-blur-md">
      <div className="font-semibold uppercase tracking-[0.2em] text-white/70">Landing Perf</div>
      <div className="mt-2 space-y-1">
        <div>Profile: {snapshot.profile}</div>
        <div>Media: {policy.mediaProfile}</div>
        <div>FPS: {formatMetric(telemetry.fps)}</div>
        <div>Frame: {formatMetric(telemetry.frameTime, 'ms')}</div>
        <div>Scroll: {formatMetric(telemetry.scrollFrameMs, 'ms')}</div>
        <div>Long task: {formatMetric(telemetry.longTaskMs, 'ms')}</div>
        <div>Decode lag: {formatMetric(telemetry.videoDecodeLagMs, 'ms')}</div>
        <div>Scrub: {policy.allowVideoScrub ? 'on' : 'off'}</div>
        <div>Dual video: {policy.allowDualVideoLayers ? 'on' : 'off'}</div>
        <div>Glass fx: {policy.allowGlassDisplacement ? 'on' : 'off'}</div>
        <div>Backdrop blur: {policy.allowBackdropBlur ? 'on' : 'off'}</div>
      </div>
    </aside>
  )
}
