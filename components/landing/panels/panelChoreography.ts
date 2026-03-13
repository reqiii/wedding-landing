import styles from '@/components/landing/LandingShell.module.css'
import { cn } from '@/lib/utils'

type LandingCueChannel = 'eyebrow' | 'heading' | 'body' | 'support'

const CUE_SHIFT_Y: Record<LandingCueChannel, string> = {
  eyebrow: '0.4rem',
  heading: '0.5rem',
  body: '0.7rem',
  support: '0.55rem',
}

export function getCueProps(channel: LandingCueChannel) {
  return {
    className: cn(styles.cue, channel === 'body' ? 'space-y-4' : 'space-y-2'),
    'data-channel': channel,
    style: {
      ['--cue-shift-y' as string]: CUE_SHIFT_Y[channel],
    },
  } as const
}
