import styles from '@/components/landing/LandingShell.module.css'
import type { LandingSegmentConfig } from '@/lib/landing/scenes/sceneTypes'
import { cn } from '@/lib/utils'

type LandingCueChannel = 'eyebrow' | 'heading' | 'body' | 'support'

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

function getCueMotionWindow(segment: LandingSegmentConfig, channel: LandingCueChannel) {
  const cue = segment.textChoreography.find((entry) => entry.channel === channel)
  if (!cue) {
    return null
  }

  const peak = clamp(Math.min(cue.start + 0.2, cue.end - 0.14), cue.start + 0.1, cue.end - 0.08)
  const enterGain = 1 / Math.max(peak - cue.start, 0.08)
  const exitGain = 1 / Math.max(1 - cue.end, 0.08)

  return {
    start: cue.start,
    peak,
    end: cue.end,
    enterGain,
    exitGain,
  }
}

export function getCueProps(segment: LandingSegmentConfig, channel: LandingCueChannel) {
  const window = getCueMotionWindow(segment, channel)

  return {
    className: cn(styles.cue, channel === 'body' ? 'space-y-4' : 'space-y-2'),
    'data-channel': channel,
    style: {
      ...(window
        ? {
            ['--cue-enter-start' as string]: window.start.toFixed(3),
            ['--cue-enter-peak' as string]: window.peak.toFixed(3),
            ['--cue-exit-start' as string]: window.end.toFixed(3),
            ['--cue-enter-gain' as string]: window.enterGain.toFixed(3),
            ['--cue-exit-gain' as string]: window.exitGain.toFixed(3),
          }
        : {}),
    },
  } as const
}
