import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentPulse — Gestion d\'assurance simplifiée',
  description: 'Plateforme SaaS pour agents d\'assurance au Cameroun.',
  manifest: '/manifest.json',
  icons: { apple: '/icons/icon-192x192.png' },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
