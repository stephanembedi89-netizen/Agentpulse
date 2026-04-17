import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Abonnement expiré — AgentPulse' }

const PLANS_EXPIRED = [
  {
    name:  'Starter',
    price: '49 000 FCFA/mois',
    color: 'border-white/10',
    features: [
      'Jusqu\'à 3 agents',
      'Pipeline CRM',
      'Module Polices',
      'Tableau de bord',
      'Support email',
    ],
  },
  {
    name:  'Pro',
    price: '99 000 FCFA/mois',
    promo: '(12 premiers mois — prix normal 149 000)',
    color: 'border-blue-500/40 bg-blue-500/5',
    highlight: true,
    features: [
      'Jusqu\'à 15 agents',
      'Tout le Starter +',
      'Superviseurs & validation',
      'Commissions & Sinistres',
      'Alertes & KPIs équipe',
      'Espace Manager complet',
      'Support prioritaire',
    ],
  },
  {
    name:  'Expert',
    price: 'Sur devis',
    color: 'border-white/10',
    features: [
      'Agents illimités',
      'Tout le Pro +',
      'Formation & onboarding VIP',
      'Accompagnement dédié',
      'Intégrations sur mesure',
      'SLA garanti',
    ],
  },
]

const PAYMENTS = [
  { label: 'MTN Mobile Money', icon: '📱' },
  { label: 'Orange Money',     icon: '🟠' },
  { label: 'Virement FCFA',   icon: '🏦' },
]

export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-[#080F1D] text-white px-4 py-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="font-black text-xl text-white">
            Agent<span className="text-blue-500">Pulse</span>
          </span>
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mt-6 mb-4">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black mb-2">Votre essai a expiré</h1>
          <p className="text-white/40 max-w-md mx-auto">
            Choisissez un forfait pour continuer à piloter votre équipe commerciale.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {PLANS_EXPIRED.map(plan => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${plan.color}`}
            >
              {plan.highlight && (
                <span className="text-[11px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full w-fit mb-3 uppercase tracking-wide">
                  ⭐ Recommandé
                </span>
              )}
              <p className="text-lg font-bold text-white">{plan.name}</p>
              <p className={`text-xl font-black mt-1 mb-0.5 ${plan.highlight ? 'text-blue-400' : 'text-white'}`}>
                {plan.price}
              </p>
              {plan.promo && (
                <p className="text-[11px] text-white/30 mb-3 italic">{plan.promo}</p>
              )}
              <ul className="flex flex-col gap-1.5 mt-3 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Modes de paiement */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-4 text-center">
            Modes de paiement acceptés
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            {PAYMENTS.map(p => (
              <div key={p.label} className="flex items-center gap-2 text-sm text-white/60">
                <span className="text-xl">{p.icon}</span>
                {p.label}
              </div>
            ))}
          </div>
        </div>

        {/* CTA contact */}
        <div className="text-center flex flex-col items-center gap-4">
          <a
            href="mailto:contact@jengu.ai"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contacter Jengu.AI
          </a>
          <a
            href="tel:+237XXXXXXXXX"
            className="text-white/40 hover:text-white transition-colors text-sm"
          >
            📞 +237 XXX XXX XXX
          </a>
          <p className="text-white/20 text-xs">Réponse sous 24h · Du lundi au vendredi</p>
          <Link href="/pricing" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
            Voir la page tarifs complète →
          </Link>
        </div>

      </div>
    </div>
  )
}
