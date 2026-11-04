import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://my-next-site-eta.vercel.app'),
  title: 'DIVINUM — Independent Creative Studio',
  description: 'DIVINUM is an independent creative studio for culture-shaping brands, spaces and ideas. Digital experiences, brand worlds and creative technology.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'DIVINUM',
    url: '/',
    title: 'DIVINUM — Independent Creative Studio',
    description: 'An independent creative studio for culture-shaping brands, spaces and ideas.',
    images: [
      {
        url: '/og.svg',
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
    description: 'An independent creative studio for culture-shaping brands, spaces and ideas.',
    images: ['/og.svg'],
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
    <html lang="en-GB" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            additionalType: 'https://schema.org/ProfessionalService',
            name: 'DIVINUM',
            url: 'https://my-next-site-eta.vercel.app',
            description: 'Independent creative studio for culture-shaping brands, spaces and ideas.',
            areaServed: 'Worldwide',
          }) }}
        />
      </head>
      <body className="bg-obsidian antialiased">
        {children}
      </body>
    </html>
  )
}