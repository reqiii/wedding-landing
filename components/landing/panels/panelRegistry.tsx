'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import type { LandingPanelKey } from '@/lib/landing/core/contracts'
import type { LandingPanelRuntimeProps } from '@/components/landing/panels/panelTypes'

const PANEL_REGISTRY: Record<LandingPanelKey, ComponentType<LandingPanelRuntimeProps>> = {
  intro: dynamic(() => import('@/components/landing/panels/IntroPanel').then((mod) => mod.IntroPanel), {
    ssr: false,
    loading: () => null,
  }),
  story: dynamic(() => import('@/components/landing/panels/StoryPanel').then((mod) => mod.StoryPanel), {
    ssr: false,
    loading: () => null,
  }),
  details: dynamic(
    () => import('@/components/landing/panels/DetailsPanel').then((mod) => mod.DetailsPanel),
    {
      ssr: false,
      loading: () => null,
    }
  ),
  location: dynamic(
    () => import('@/components/landing/panels/LocationPanel').then((mod) => mod.LocationPanel),
    {
      ssr: false,
      loading: () => null,
    }
  ),
  rsvp: dynamic(() => import('@/components/landing/panels/RsvpPanel').then((mod) => mod.RsvpPanel), {
    ssr: false,
    loading: () => null,
  }),
  finale: dynamic(
    () => import('@/components/landing/panels/FinalePanel').then((mod) => mod.FinalePanel),
    {
      ssr: false,
      loading: () => null,
    }
  ),
}

export function getLandingPanelComponent(panelKey: LandingPanelKey) {
  return PANEL_REGISTRY[panelKey]
}
