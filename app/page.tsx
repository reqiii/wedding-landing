import { ScrollIndicators } from '@/components/ScrollIndicators'
import { ScrollStoryScene } from '@/components/sections/ScrollStoryScene'

export default function Home() {
  return (
    <main className="min-h-screen">
      <ScrollIndicators />
      <ScrollStoryScene />
    </main>
  )
}
