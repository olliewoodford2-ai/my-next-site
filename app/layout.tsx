import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pear — not an agency on the clock, a partner in the upside',
  description: 'Pear makes you appear. Data-driven SEO, tailored software and revenue-share partnerships. Grow your traffic and outrun your competitors.',
  metadataBase: new URL('https://pear.no'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'Pear',
    url: '/',
    title: 'Pear — not an agency on the clock, a partner in the upside',
    description: 'Pear makes you appear. Data-driven SEO, tailored software and revenue-share partnerships.',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'A neoclassical painting of a colossal golden pear on a marble pedestal under a cerulean sky',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pear — not an agency on the clock, a partner in the upside',
    description: 'Pear makes you appear. Data-driven SEO, tailored software and revenue-share partnerships.',
    images: ['/og.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'color-scheme': 'only light',
    'theme-color': '#0b0a09',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b0a09',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{ scrollbarWidth: 'none' }}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-press antialiased">
        {children}
      </body>
    </html>
  )
}