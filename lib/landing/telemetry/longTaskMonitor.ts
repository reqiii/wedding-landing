export function observeLongTasks(onLongTask: (duration: number) => void) {
  if (typeof PerformanceObserver === 'undefined') {
    return () => undefined
  }

  let observer: PerformanceObserver | null = null

  try {
    observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        onLongTask(entry.duration)
      })
    })
    observer.observe({ entryTypes: ['longtask'] })
  } catch {
    observer = null
  }

  return () => observer?.disconnect()
}
