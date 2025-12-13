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
    'Hapien is a private, hyperlocal social network that nurtures friendships and creates new connections within built communities through recurring hangouts.',
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
      'A private, hyperlocal social network that nurtures friendships through shared experiences.',
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
      'A private, hyperlocal social network that nurtures friendships through shared experiences.',
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
  themeColor: '#a855f7',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1c1917',
              color: '#fafaf9',
              borderRadius: '12px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fafaf9',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#fafaf9',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
