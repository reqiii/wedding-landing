'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

type SceneContextValue = {
  progress: number
  reducedMotion: boolean
  revealed: boolean
}

const SceneContext = createContext<SceneContextValue>({
  progress: 1,
  reducedMotion: false,
  revealed: true,
})

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const lerp = (from: number, to: number, t: number) => from + (to - from) * t
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

type ScrollMetrics = {
  scrollY: number
  viewportH: number
  docH: number
}

const scrollSubscribers = new Set<() => void>()
let scrollMetrics: ScrollMetrics = { scrollY: 0, viewportH: 0, docH: 0 }
let scrollRaf = 0

const computeScrollMetrics = (): ScrollMetrics => {
  const scrollElement = document.scrollingElement ?? document.documentElement ?? document.body
  const viewportH = window.innerHeight || 0
  const docH = scrollElement.scrollHeight || 0
  const scrollY = Math.max(window.scrollY, scrollElement.scrollTop, document.body.scrollTop)
  return { scrollY, viewportH, docH }
}

const runSubscribers = () => {
  scrollRaf = 0
  scrollMetrics = computeScrollMetrics()
  scrollSubscribers.forEach((subscriber) => subscriber())
}

const handleScroll = () => {
  if (scrollRaf) return
  scrollRaf = window.requestAnimationFrame(runSubscribers)
}

const startScrollListener = () => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll)
  handleScroll()
}

const stopScrollListener = () => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  if (scrollRaf) {
    window.cancelAnimationFrame(scrollRaf)
    scrollRaf = 0
  }
}

const subscribeToScroll = (callback: () => void) => {
  scrollSubscribers.add(callback)
  if (scrollSubscribers.size === 1) {
    startScrollListener()
  }

  return () => {
    scrollSubscribers.delete(callback)
    if (scrollSubscribers.size === 0) {
      stopScrollListener()
    }
  }
}

export const getScrollMetrics = () => scrollMetrics

export const subscribeToScrollMetrics = (callback: () => void) => subscribeToScroll(callback)

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(motionQuery.matches)
    update()
    motionQuery.addEventListener('change', update)
    return () => motionQuery.removeEventListener('change', update)
  }, [])

  return reduced
}

const useScrollScene = (ref: React.RefObject<HTMLElement>) => {
  const reducedMotion = usePrefersReducedMotion()
  const [progress, setProgress] = useState(1)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (reducedMotion) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setRevealed(true)
          }
        },
        { threshold: 0.15 }
      )

      observer.observe(element)
      return () => observer.disconnect()
    }

    const updateProgress = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      const start = viewport * 0.85
      const end = -rect.height * 0.2
      const next = clamp((start - rect.top) / (start - end))
      setProgress(next)
    }

    const unsubscribe = subscribeToScroll(updateProgress)
    updateProgress()
    return unsubscribe
  }, [ref, reducedMotion])

  return {
    progress: reducedMotion ? (revealed ? 1 : 0) : progress,
    reducedMotion,
    revealed,
  }
}

const getSceneStyle = (progress: number, reducedMotion: boolean, revealed: boolean): CSSProperties => {
  if (reducedMotion) {
    return {
      opacity: revealed ? 1 : 0,
      transform: 'none',
      transition: 'opacity 600ms ease',
    }
  }

  const fadeIn = smoothstep(0.05, 0.25, progress)
  const fadeOut = 1 - smoothstep(0.78, 0.97, progress)
  const opacity = clamp(fadeIn * fadeOut)
  const translateY = lerp(18, -6, smoothstep(0.05, 0.65, progress))
  const scale = lerp(0.985, 1, smoothstep(0.1, 0.7, progress))

  return {
    opacity,
    transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
  }
}

type ScrollSceneProps = {
  id?: string
  className?: string
  innerClassName?: string
  children: ReactNode
}

export function ScrollScene({ id, className, innerClassName, children }: ScrollSceneProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const { progress, reducedMotion, revealed } = useScrollScene(sectionRef)
  const contextValue = useMemo(
    () => ({ progress, reducedMotion, revealed }),
    [progress, reducedMotion, revealed]
  )

  return (
    <section ref={sectionRef} id={id} className={className}>
      <div className={`scene-layer ${innerClassName ?? ''}`.trim()} style={getSceneStyle(progress, reducedMotion, revealed)}>
        <SceneContext.Provider value={contextValue}>{children}</SceneContext.Provider>
      </div>
    </section>
  )
}

type SceneRevealProps = {
  start?: number
  duration?: number
  distance?: number
  className?: string
  children: ReactNode
}

export function SceneReveal({
  start = 0.18,
  duration = 0.35,
  distance = 14,
  className,
  children,
}: SceneRevealProps) {
  const { progress, reducedMotion, revealed } = useContext(SceneContext)

  if (reducedMotion) {
    return (
      <div
        className={className}
        style={{
          opacity: revealed ? 1 : 0,
          transition: 'opacity 600ms ease',
        }}
      >
        {children}
      </div>
    )
  }

  const localProgress = clamp((progress - start) / duration)
  const eased = smoothstep(0, 1, localProgress)

  return (
    <div
      className={className}
      style={{
        opacity: eased,
        transform: `translate3d(0, ${lerp(distance, 0, eased)}px, 0)`,
      }}
    >
      {children}
    </div>
  )
}
