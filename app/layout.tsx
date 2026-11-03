import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DIVINUM — Independent Creative Studio',
  description: 'DIVINUM explores the intersection of digital art, architecture, fashion, and technology. An avant-garde creative studio based in London.',
  metadataBase: new URL('https://divinum.studio'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'DIVINUM',
    url: '/',
    title: 'DIVINUM — Independent Creative Studio',
    description: 'DIVINUM explores the intersection of digital art, architecture, fashion, and technology.',
    images: [
      {
        url: '/og.jpg',
        width: 1920,
        height: 1080,
        alt: 'DIVINUM — An immersive digital experience',
      },
    ],
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DIVINUM — Independent Creative Studio',
    description: 'DIVINUM explores the intersection of digital art, architecture, fashion, and technology.',
    images: ['/og.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'color-scheme': 'dark',
    'theme-color': '#0A0A0A',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0A',
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB" className="dark" style={{ scrollbarWidth: 'none' }}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-obsidian antialiased cursor-none">
        {children}
      </body>
    </html>
  )
}