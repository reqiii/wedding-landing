import { Hero } from '@/components/sections/Hero'
import { Story } from '@/components/sections/Story'
import { Details } from '@/components/sections/Details'
import { LocationTransfer } from '@/components/sections/LocationTransfer'
import { RSVP } from '@/components/sections/RSVP'
import { FinalCountdown } from '@/components/sections/FinalCountdown'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Story />
      <Details />
      <LocationTransfer />
      <RSVP />
      <FinalCountdown />
    </main>
  )
}
