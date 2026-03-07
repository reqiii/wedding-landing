export type ScrollFrameSample = {
  duration: number
  timestamp: number
}

export function createScrollFrameMonitor(onSample: (sample: ScrollFrameSample) => void) {
  return {
    measure(run: () => void) {
      const start = performance.now()
      run()
      onSample({
        duration: performance.now() - start,
        timestamp: performance.now(),
      })
    },
  }
}
