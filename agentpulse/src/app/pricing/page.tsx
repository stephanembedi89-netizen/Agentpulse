import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Renouveler votre abonnement — AgentPulse' }

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-orange-600/20 border border-orange-600/40 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">⚠</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Abonnement expiré</h1>
        <p className="text-gray-400 mb-8">
          Votre période d&apos;essai ou abonnement a expiré. Renouvelez pour continuer à utiliser AgentPulse.
        </p>
        <Link
          href="mailto:contact@agentpulse.cm"
          className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Contacter l&apos;équipe commerciale
        </Link>
        <p className="mt-4">
          <Link href="/login" className="text-gray-500 hover:text-gray-400 text-sm transition-colors">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
