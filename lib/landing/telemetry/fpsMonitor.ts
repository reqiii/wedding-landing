export type FpsSample = {
  fps: number
  frameTime: number
}

export function createFpsMonitor(onSample: (sample: FpsSample) => void) {
  let rafId = 0
  let frames = 0
  let lastFrameTime = 16.7
  let lastNow = 0
  let windowStart = 0

  const tick = (now: number) => {
    if (!windowStart) {
      windowStart = now
      lastNow = now
    }

    frames += 1
    lastFrameTime = now - lastNow
    lastNow = now

    if (now - windowStart >= 500) {
      onSample({
        fps: (frames * 1000) / (now - windowStart),
        frameTime: lastFrameTime,
      })
      frames = 0
      windowStart = now
    }

    rafId = window.requestAnimationFrame(tick)
  }

  return {
    start() {
      if (!rafId) {
        rafId = window.requestAnimationFrame(tick)
      }
    },
    stop() {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
        rafId = 0
      }
      frames = 0
      lastNow = 0
      windowStart = 0
    },
  }
}
