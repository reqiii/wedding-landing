import styles from '@/components/landing/LandingShell.module.css'
import type { LandingSegmentConfig } from '@/lib/landing/scenes/sceneTypes'
import { cn } from '@/lib/utils'

type LandingCueChannel = 'eyebrow' | 'heading' | 'body' | 'support'

function getCueTransitionDelay(segment: LandingSegmentConfig, channel: LandingCueChannel) {
  const cue = segment.textChoreography.find((entry) => entry.channel === channel)
  return cue ? `${Math.round(cue.start * 280)}ms` : undefined
}

export function getCueProps(segment: LandingSegmentConfig, channel: LandingCueChannel) {
  return {
    className: cn(styles.cue, channel === 'body' ? 'space-y-4' : 'space-y-2'),
    'data-channel': channel,
    style: {
      transitionDelay: getCueTransitionDelay(segment, channel),
    },
  } as const
}
