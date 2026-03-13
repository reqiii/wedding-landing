'use client'

import type { ComponentType } from 'react'
import { DetailsPanel } from '@/components/landing/panels/DetailsPanel'
import { FinalePanel } from '@/components/landing/panels/FinalePanel'
import { IntroPanel } from '@/components/landing/panels/IntroPanel'
import { LocationPanel } from '@/components/landing/panels/LocationPanel'
import { RsvpPanel } from '@/components/landing/panels/RsvpPanel'
import { StoryPanel } from '@/components/landing/panels/StoryPanel'
import type { LandingPanelKey } from '@/lib/landing/core/contracts'
import type { LandingPanelRuntimeProps } from '@/components/landing/panels/panelTypes'

const PANEL_REGISTRY: Record<LandingPanelKey, ComponentType<LandingPanelRuntimeProps>> = {
  intro: IntroPanel,
  story: StoryPanel,
  details: DetailsPanel,
  location: LocationPanel,
  rsvp: RsvpPanel,
  finale: FinalePanel,
}

export function getLandingPanelComponent(panelKey: LandingPanelKey) {
  return PANEL_REGISTRY[panelKey]
}
