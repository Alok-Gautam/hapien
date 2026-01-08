import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://hapien.com'),
  title: {
    default: 'Hapien - The Happy Sapien Network',
    template: '%s | Hapien',
  },
  description:
    'Hapien is a private, hyperlocal social network that nurtures connections within built communities through recurring hangouts.',
  keywords: [
    'social network',
    'community',
    'friends',
    'hangouts',
    'local',
    'connections',
  ],
  authors: [{ name: 'Alok Gautam', url: 'mailto:alok@abhranta.com' }],
  creator: 'Hapien',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://hapien.com',
    siteName: 'Hapien',
    title: 'Hapien - The Happy Sapien Network',
    description:
      'A private, hyperlocal social network that nurtures connections through shared experiences.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Hapien - The Happy Sapien Network',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hapien - The Happy Sapien Network',
    description:
      'A private, hyperlocal social network that nurtures connections through shared experiences.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8B5CF6', // Violet primary
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA and iOS-specific meta tags for better storage persistence */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Hapien" />
        <meta name="mobile-web-app-capable" content="yes" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Plus Jakarta Sans - Body font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Fraunces - Display font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1A1833',
              color: '#F8F7FF',
              borderRadius: '16px',
              padding: '14px 18px',
              border: '1px solid #504D73',
              boxShadow: '0 4px 16px -4px rgba(63, 21, 122, 0.4)',
              fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            },
            success: {
              iconTheme: {
                primary: '#22C55E', // Sage
                secondary: '#F8F7FF',
              },
              style: {
                background: '#14532D',
                borderColor: '#166534',
              },
            },
            error: {
              iconTheme: {
                primary: '#F43F5E', // Rose
                secondary: '#F8F7FF',
              },
              style: {
                background: '#9F1239',
                borderColor: '#BE123C',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
