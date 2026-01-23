import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Our Wedding | Save the Date',
  description: 'Join us for our special day. RSVP and find all the details you need.',
  openGraph: {
    title: 'Our Wedding | Save the Date',
    description: 'Join us for our special day. RSVP and find all the details you need.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Wedding | Save the Date',
    description: 'Join us for our special day. RSVP and find all the details you need.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased">
        {/* SVG Filters for Glass Refraction (background-only layers) */}
        <svg className="absolute w-0 h-0" aria-hidden="true">
          <defs>
            <filter id="glass-displacement-soft" x="-50%" y="-50%" width="200%" height="200%">
              <feTurbulence
                baseFrequency="0.02 0.06"
                numOctaves="2"
                result="noise"
                type="fractalNoise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="6"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            <filter id="glass-displacement-strong" x="-50%" y="-50%" width="200%" height="200%">
              <feTurbulence
                baseFrequency="0.03 0.08"
                numOctaves="3"
                result="noise"
                type="fractalNoise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="14"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  )
}
