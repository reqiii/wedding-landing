import { Hero } from '@/components/sections/Hero'
import { QuickCards } from '@/components/sections/QuickCards'
import { Story } from '@/components/sections/Story'
import { Details } from '@/components/sections/Details'
import { RSVP } from '@/components/sections/RSVP'
import { FAQ } from '@/components/sections/FAQ'
import { Footer } from '@/components/sections/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <QuickCards />
      <Story />
      <Details />
      <RSVP />
      <FAQ />
      <Footer />
    </main>
  )
}
