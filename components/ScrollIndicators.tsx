'use client'

import { useEffect, useRef, useState } from 'react'

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export function ScrollIndicators() {
  const rafRef = useRef<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [showHint, setShowHint] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let isTicking = false
    const getScrollElement = () =>
      document.scrollingElement ?? document.documentElement ?? document.body
    const updateProgress = () => {
      const scrollElement = getScrollElement()
      const total = Math.max(0, scrollElement.scrollHeight - window.innerHeight)
      const scrollTop = Math.max(window.scrollY, scrollElement.scrollTop, document.body.scrollTop)
      const nextProgress = total > 0 ? clamp(scrollTop / total) : 0
      setProgress(nextProgress)
      setShowHint(window.scrollY < window.innerHeight * 0.25)
    }

    const updateOnScroll = () => {
      if (!isTicking) {
        isTicking = true
        rafRef.current = window.requestAnimationFrame(() => {
          isTicking = false
          updateProgress()
        })
      }
    }

    updateProgress()
    window.addEventListener('scroll', updateOnScroll, { passive: true })
    window.addEventListener('resize', updateOnScroll)

    return () => {
      window.removeEventListener('scroll', updateOnScroll)
      window.removeEventListener('resize', updateOnScroll)
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <>
      <div className="pointer-events-none fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 opacity-[0.15] md:block">
        <div className="flex h-56 w-3 items-center justify-center rounded-full bg-white/35 p-1 backdrop-blur-md shadow-[0_10px_30px_rgba(15,23,42,0.15)]">
          <div className="relative h-full w-full overflow-hidden rounded-full bg-white/40">
            <div
              className="absolute top-0 bottom-0 left-0 right-0 origin-top bg-black shadow-[0_0_10px_rgba(0,0,0,0.35)] transition-transform duration-150 ease-out"
              style={{ transform: `scaleY(${progress})` }}
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-6 bottom-4 z-50 opacity-[0.15] md:hidden">
        <div className="flex h-3 w-full items-center justify-center rounded-full bg-white/35 p-1 backdrop-blur-md shadow-[0_10px_30px_rgba(15,23,42,0.15)]">
          <div className="relative h-full w-full overflow-hidden rounded-full bg-white/40">
            <div
              className="absolute left-0 right-0 top-0 bottom-0 origin-left bg-black shadow-[0_0_10px_rgba(0,0,0,0.35)] transition-transform duration-150 ease-out"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-10 z-50 flex justify-center">
        <div
          className={`relative text-dark-gray transition-all duration-300 ${
            showHint ? 'opacity-70 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          aria-hidden="true"
        >
          {!reducedMotion && (
            <span className="scroll-hint-ring absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/80">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full"
              >
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeDasharray="34 90"
                  className="opacity-60"
                />
              </svg>
            </span>
          )}
          <span className={reducedMotion ? '' : 'scroll-hint'}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="opacity-80"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </>
  )
}
