import type { LandingTextCue, LandingTextCueChannel } from '@/lib/landing/core/contracts'

export function buildTextChoreography(
  channels: LandingTextCueChannel[],
  startAt = 0.18,
  step = 0.14
): LandingTextCue[] {
  return channels.map((channel, index) => {
    const start = startAt + index * step
    return {
      id: `${channel}-${index}`,
      channel,
      start,
      end: Math.min(1, start + 0.28),
    }
  })
}
