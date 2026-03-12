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
      <body className="antialiased">{children}</body>
    </html>
  )
}
