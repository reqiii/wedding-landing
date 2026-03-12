import type { LandingResolvedAsset } from '@/lib/landing/media/assetRegistry'
import type { LandingMediaPolicy, LandingPerformanceBudget } from '@/lib/landing/tier/tierTypes'

export type LandingMediaPlaneRole = 'active' | 'standby' | 'idle'

export type LandingMediaPlane = {
  id: string
  element: HTMLVideoElement
  role: LandingMediaPlaneRole
  asset: LandingResolvedAsset | null
  lastUsedAt: number
}

type LandingMediaPoolOptions = {
  onPlaneCreated?: (plane: LandingMediaPlane) => void
}

export type LandingMediaPool = {
  attachHost: (host: HTMLElement | null) => () => void
  configure: (policy: LandingMediaPolicy, budget: LandingPerformanceBudget | null) => void
  getPlaneByRole: (role: Exclude<LandingMediaPlaneRole, 'idle'>) => LandingMediaPlane | null
  acquirePlane: (asset: LandingResolvedAsset, role: Exclude<LandingMediaPlaneRole, 'idle'>) => LandingMediaPlane | null
  releaseRole: (role: Exclude<LandingMediaPlaneRole, 'idle'>) => void
  forEachPlane: (callback: (plane: LandingMediaPlane) => void) => void
  destroy: () => void
}

function applyPlaneRole(plane: LandingMediaPlane) {
  plane.element.dataset.mediaRole = plane.role
  plane.element.style.opacity = plane.role === 'active' ? '1' : '0'
  plane.element.style.visibility = plane.role === 'idle' ? 'hidden' : 'visible'
  plane.element.preload = plane.role === 'active' ? 'auto' : 'metadata'
}

function createVideoPlane(index: number): LandingMediaPlane {
  const element = document.createElement('video')
  element.muted = true
  element.playsInline = true
  element.crossOrigin = 'anonymous'
  element.setAttribute('muted', '')
  element.setAttribute('playsinline', '')
  element.style.position = 'absolute'
  element.style.inset = '0'
  element.style.width = '100%'
  element.style.height = '100%'
  element.style.objectFit = 'cover'
  element.style.background = '#050816'
  element.style.pointerEvents = 'none'
  element.style.opacity = '0'
  element.style.transition = 'opacity 220ms ease'

  const plane: LandingMediaPlane = {
    id: `landing-media-plane-${index}`,
    element,
    role: 'idle',
    asset: null,
    lastUsedAt: Date.now(),
  }

  applyPlaneRole(plane)
  return plane
}

export function createLandingMediaPool(options: LandingMediaPoolOptions = {}): LandingMediaPool {
  const { onPlaneCreated } = options
  let host: HTMLElement | null = null
  let maxPlanes = 0
  const planes: LandingMediaPlane[] = []

  const attachPlane = (plane: LandingMediaPlane) => {
    if (!host || plane.element.parentElement === host) {
      return
    }

    host.appendChild(plane.element)
  }

  const trimPool = () => {
    while (planes.length > maxPlanes) {
      const idleIndex = planes.findIndex((plane) => plane.role === 'idle')
      const planeIndex = idleIndex >= 0 ? idleIndex : planes.length - 1
      const [plane] = planes.splice(planeIndex, 1)
      plane.element.pause()
      plane.element.removeAttribute('src')
      plane.element.load()
      plane.element.remove()
    }
  }

  const ensurePoolSize = (count: number) => {
    while (planes.length < count) {
      const plane = createVideoPlane(planes.length)
      planes.push(plane)
      attachPlane(plane)
      onPlaneCreated?.(plane)
    }
  }

  const markPlane = (
    plane: LandingMediaPlane,
    role: LandingMediaPlaneRole,
    asset: LandingResolvedAsset | null
  ) => {
    plane.role = role
    plane.asset = asset
    plane.lastUsedAt = Date.now()
    applyPlaneRole(plane)
    attachPlane(plane)
  }

  const choosePlane = (
    asset: LandingResolvedAsset,
    role: Exclude<LandingMediaPlaneRole, 'idle'>
  ) => {
    const exactMatch = planes.find((plane) => plane.asset?.assetId === asset.assetId)
    if (exactMatch) {
      return exactMatch
    }

    const idlePlane = planes.find((plane) => plane.role === 'idle')
    if (idlePlane) {
      return idlePlane
    }

    if (role === 'standby') {
      return null
    }

    const standbyPlane = planes.find((plane) => plane.role === 'standby')
    if (standbyPlane) {
      return standbyPlane
    }

    return planes[0] ?? null
  }

  return {
    attachHost(nextHost) {
      host = nextHost
      for (let index = 0; index < planes.length; index += 1) {
        attachPlane(planes[index])
      }

      return () => {
        if (host !== nextHost) {
          return
        }

        host = null
      }
    },
    configure(policy, budget) {
      const budgetMax = budget?.maxActiveVideos ?? 1
      const requestedPlanes = policy.allowVideo ? 1 + policy.standbyPoolSize : 0
      maxPlanes = Math.max(0, Math.min(budgetMax, requestedPlanes))

      ensurePoolSize(maxPlanes)
      trimPool()
    },
    getPlaneByRole(role) {
      return planes.find((plane) => plane.role === role) ?? null
    },
    acquirePlane(asset, role) {
      ensurePoolSize(maxPlanes)
      const plane = choosePlane(asset, role)
      if (!plane) {
        return null
      }

      for (let index = 0; index < planes.length; index += 1) {
        const current = planes[index]
        if (current !== plane && current.role === role) {
          markPlane(current, 'idle', null)
        }
      }

      markPlane(plane, role, asset)
      return plane
    },
    releaseRole(role) {
      const plane = planes.find((entry) => entry.role === role)
      if (!plane) {
        return
      }

      markPlane(plane, 'idle', null)
    },
    forEachPlane(callback) {
      for (let index = 0; index < planes.length; index += 1) {
        callback(planes[index])
      }
    },
    destroy() {
      for (let index = 0; index < planes.length; index += 1) {
        const plane = planes[index]
        plane.element.pause()
        plane.element.removeAttribute('src')
        plane.element.load()
        plane.element.remove()
      }
      planes.length = 0
      host = null
    },
  }
}
