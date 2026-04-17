import type { Metadata } from 'next'
import DemoForm from './DemoForm'

export const metadata: Metadata = { title: 'Essai gratuit 14 jours — AgentPulse' }

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#080F1D] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="font-black text-2xl text-white tracking-tight">
            Agent<span className="text-blue-500">Pulse</span>
          </span>
          <h1 className="text-3xl font-black text-white mt-4 mb-2">
            Démarrez votre essai gratuit
          </h1>
          <p className="text-white/40">
            14 jours offerts · Aucune carte requise · Accès immédiat
          </p>
        </div>

        {/* Badges */}
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {['✓ Setup offert', '✓ 14 jours gratuits', '✓ Support inclus'].map(b => (
            <span key={b} className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
              {b}
            </span>
          ))}
        </div>

        <DemoForm />

        <p className="text-center text-white/20 text-xs mt-6">
          Déjà un compte ?{' '}
          <a href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  )
}
