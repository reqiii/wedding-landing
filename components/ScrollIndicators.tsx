'use client'

import { useEffect, useRef, useState } from 'react'
import { getScrollMetrics, subscribeToScrollMetrics } from '@/components/motion/ScrollScene'

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export function ScrollIndicators() {
  const rafRef = useRef<number | null>(null)
  const lastProgressRef = useRef(0)
  const lastHintRef = useRef(true)
  const desktopProgressRef = useRef<HTMLDivElement | null>(null)
  const mobileProgressRef = useRef<HTMLDivElement | null>(null)
  const hintRef = useRef<HTMLDivElement | null>(null)
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

    const updateProgress = () => {
      const { scrollY, viewportH, docH } = getScrollMetrics()
      const total = Math.max(0, docH - viewportH)
      const nextProgress = total > 0 ? clamp(scrollY / total) : 0
      const nextHint = scrollY < viewportH * 0.25

      if (Math.abs(nextProgress - lastProgressRef.current) > 0.001) {
        lastProgressRef.current = nextProgress
        desktopProgressRef.current?.style.setProperty('--scroll-progress-y', String(nextProgress))
        mobileProgressRef.current?.style.setProperty('--scroll-progress-x', String(nextProgress))
      }
      if (nextHint !== lastHintRef.current) {
        lastHintRef.current = nextHint
        if (hintRef.current) {
          hintRef.current.dataset.visible = nextHint ? 'true' : 'false'
        }
      }
    }

    const unsubscribe = subscribeToScrollMetrics(() => {
      if (!rafRef.current) {
        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = null
          updateProgress()
        })
      }
    })

    updateProgress()
    return () => {
      unsubscribe()
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
              ref={desktopProgressRef}
              className="absolute top-0 bottom-0 left-0 right-0 origin-top bg-black shadow-[0_0_10px_rgba(0,0,0,0.35)] transition-transform duration-150 ease-out"
              style={{ transform: 'scaleY(var(--scroll-progress-y, 0))' }}
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-6 bottom-4 z-50 opacity-[0.15] md:hidden">
        <div className="flex h-3 w-full items-center justify-center rounded-full bg-white/35 p-1 backdrop-blur-md shadow-[0_10px_30px_rgba(15,23,42,0.15)]">
          <div className="relative h-full w-full overflow-hidden rounded-full bg-white/40">
            <div
              ref={mobileProgressRef}
              className="absolute left-0 right-0 top-0 bottom-0 origin-left bg-black shadow-[0_0_10px_rgba(0,0,0,0.35)] transition-transform duration-150 ease-out"
              style={{ transform: 'scaleX(var(--scroll-progress-x, 0))' }}
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-10 z-50 flex justify-center">
        <div
          ref={hintRef}
          data-visible="true"
          className="relative text-dark-gray transition-all duration-300 data-[visible=false]:translate-y-2 data-[visible=false]:opacity-0 data-[visible=true]:translate-y-0 data-[visible=true]:opacity-70"
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
