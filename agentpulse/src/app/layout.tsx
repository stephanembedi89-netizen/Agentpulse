import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentPulse — Gestion d\'assurance simplifiée',
  description: 'Plateforme performance agents d\'assurance.',
  manifest: '/manifest.json',
  icons: {
    apple: '/icons/icon-192x192.png',
    icon:  '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable:        true,
    title:          'AgentPulse',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor:   '#0D1626',
  width:        'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit:  'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#080F1D] text-white antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
