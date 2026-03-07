'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createLandingRuntimePolicy,
  detectLandingCapabilities,
  getWebGlRenderer,
  probeFrameRate,
  probeVideoDecodeScore,
  type LandingCapabilitySnapshot,
  type LandingRuntimePolicy,
} from '@/lib/landing/runtime/capabilityProfile'
import { createFpsMonitor } from '@/lib/landing/telemetry/fpsMonitor'
import { observeLongTasks } from '@/lib/landing/telemetry/longTaskMonitor'

type LandingRuntimeTelemetry = {
  fps: number | null
  frameTime: number | null
  longTaskMs: number | null
  scrollFrameMs: number | null
  videoDecodeLagMs: number | null
}

type LandingRuntimeContextValue = {
  snapshot: LandingCapabilitySnapshot
  policy: LandingRuntimePolicy
  telemetry: LandingRuntimeTelemetry
  debugEnabled: boolean
  reportScrollFrame: (duration: number) => void
  reportVideoDecodeLag: (lagMs: number) => void
}

const LandingRuntimeContext = createContext<LandingRuntimeContextValue | null>(null)

type LandingRuntimeProviderProps = {
  heroVideoSrc?: string | null
  children: ReactNode
}

function getDebugFlag() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return process.env.NODE_ENV !== 'production' || params.get('landingPerf') === '1'
}

const DEFAULT_SNAPSHOT: LandingCapabilitySnapshot = {
  profile: 'midRange',
  mediaProfile: 'desktop',
  prefersReducedMotion: false,
  isMobileSafari: false,
  saveData: false,
  effectiveType: null,
  hardwareConcurrency: null,
  deviceMemory: null,
  webglRenderer: null,
  fpsEstimate: null,
  decodeScore: null,
}

export function LandingRuntimeProvider({
  heroVideoSrc,
  children,
}: LandingRuntimeProviderProps) {
  const [snapshot, setSnapshot] = useState<LandingCapabilitySnapshot>(DEFAULT_SNAPSHOT)
  const [telemetry, setTelemetry] = useState<LandingRuntimeTelemetry>({
    fps: null,
    frameTime: null,
    longTaskMs: null,
    scrollFrameMs: null,
    videoDecodeLagMs: null,
  })
  const [debugEnabled, setDebugEnabled] = useState(false)
  const downgradedRef = useRef(false)

  useEffect(() => {
    let mounted = true

    const run = async () => {
      const [fpsEstimate, renderer, decodeScore] = await Promise.all([
        probeFrameRate(),
        Promise.resolve(getWebGlRenderer()),
        probeVideoDecodeScore(heroVideoSrc),
      ])

      if (!mounted) return
      setSnapshot(
        detectLandingCapabilities({
          fpsEstimate,
          decodeScore,
          renderer,
        })
      )
    }

    setDebugEnabled(getDebugFlag())
    run().catch(() => undefined)

    return () => {
      mounted = false
    }
  }, [heroVideoSrc])

  const policy = useMemo(() => createLandingRuntimePolicy(snapshot), [snapshot])

  useEffect(() => {
    const fpsMonitor = createFpsMonitor((sample) => {
      setTelemetry((current) => ({
        ...current,
        fps: sample.fps,
        frameTime: sample.frameTime,
      }))

      if (
        !downgradedRef.current &&
        policy.telemetryDowngradeEnabled &&
        sample.fps < 44 &&
        snapshot.profile !== 'lowEnd'
      ) {
        downgradedRef.current = true
        setSnapshot((current) => ({
          ...current,
          profile: 'midRange',
        }))
      }
    })

    fpsMonitor.start()
    const disconnectLongTasks = observeLongTasks((duration) => {
      setTelemetry((current) => ({
        ...current,
        longTaskMs: duration,
      }))
    })

    return () => {
      fpsMonitor.stop()
      disconnectLongTasks()
    }
  }, [policy.telemetryDowngradeEnabled, snapshot.profile])

  const value = useMemo<LandingRuntimeContextValue>(
    () => ({
      snapshot,
      policy,
      telemetry,
      debugEnabled,
      reportScrollFrame(duration) {
        setTelemetry((current) => ({
          ...current,
          scrollFrameMs: duration,
        }))
      },
      reportVideoDecodeLag(lagMs) {
        setTelemetry((current) => ({
          ...current,
          videoDecodeLagMs: lagMs,
        }))

        if (
          !downgradedRef.current &&
          policy.telemetryDowngradeEnabled &&
          lagMs > 30 &&
          snapshot.profile !== 'lowEnd'
        ) {
          downgradedRef.current = true
          setSnapshot((current) => ({
            ...current,
            profile: 'midRange',
          }))
        }
      },
    }),
    [debugEnabled, policy, snapshot, telemetry]
  )

  return (
    <LandingRuntimeContext.Provider value={value}>{children}</LandingRuntimeContext.Provider>
  )
}

export function useLandingRuntime() {
  const context = useContext(LandingRuntimeContext)
  if (!context) {
    throw new Error('useLandingRuntime must be used inside LandingRuntimeProvider')
  }
  return context
}

export function useOptionalLandingRuntime() {
  return useContext(LandingRuntimeContext)
}
