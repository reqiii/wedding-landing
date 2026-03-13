import type { LandingTextCue, LandingTextCueChannel } from '@/lib/landing/core/contracts'

type LandingTextChoreographyOptions = {
  enterStart?: number
  step?: number
  exitStart?: number
  exitStep?: number
  maxEnd?: number
}

const DEFAULT_TEXT_CHOREOGRAPHY: Required<LandingTextChoreographyOptions> = {
  enterStart: 0.12,
  step: 0.08,
  exitStart: 0.74,
  exitStep: 0.04,
  maxEnd: 0.94,
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export function buildTextChoreography(
  channels: LandingTextCueChannel[],
  options: LandingTextChoreographyOptions = {}
): LandingTextCue[] {
  const settings = {
    ...DEFAULT_TEXT_CHOREOGRAPHY,
    ...options,
  }

  return channels.map((channel, index) => {
    const start = clamp(settings.enterStart + index * settings.step, 0.02, 0.9)
    const end = clamp(
      Math.max(start + 0.18, settings.exitStart + index * settings.exitStep),
      start + 0.12,
      settings.maxEnd
    )

    return {
      id: `${channel}-${index}`,
      channel,
      start,
      end,
    }
  })
}
