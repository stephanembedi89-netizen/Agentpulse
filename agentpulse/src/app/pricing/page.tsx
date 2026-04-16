import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tarifs — AgentPulse' }

const FEATURES = [
  // [label, starter, pro, expert]
  ['Agents inclus',                  'Jusqu\'à 3',  'Jusqu\'à 15',   'Illimité'],
  ['Pipeline CRM',                   true,           true,            true],
  ['Tableau de bord agent',          true,           true,            true],
  ['Suivi des prospects',            true,           true,            true],
  ['Module Polices',                 true,           true,            true],
  ['Superviseurs & validation',      false,          true,            true],
  ['Module Commissions',             false,          true,            true],
  ['Module Sinistres',               false,          true,            true],
  ['Alertes & KPIs équipe',         false,          true,            true],
  ['Classement & ratios',            false,          true,            true],
  ['Espace Manager',                 false,          true,            true],
  ['Journal d\'activité',            false,          true,            true],
  ['Formation & onboarding inclus',  false,          false,           true],
  ['Accompagnement VIP dédié',       false,          false,           true],
  ['Intégrations sur mesure',        false,          false,           true],
  ['SLA & contrat personnalisé',     false,          false,           true],
  ['Setup offert',                   true,           true,            true],
  ['Support',                        'Email',        'Prioritaire',   'VIP 24/7'],
] as const

const PLANS = [
  {
    name:       'Starter',
    desc:       'Idéal pour tester. On vous offre le setup.',
    price:      49_000,
    promo:      null,
    badge:      null,
    promoLabel: null,
    cta:        'Commencer l\'essai',
    ctaHref:    '/register',
    highlight:  false,
    expert:     false,
  },
  {
    name:       'Pro',
    desc:       'Le prix spécial pour nos 10 premières agences.',
    price:      149_000,
    promo:      99_000,
    badge:      'Offre Lundi — 6 premiers mois',
    promoLabel: 'pendant 6 mois, puis 149 000 FCFA/mois',
    cta:        'Démarrer en Pro',
    ctaHref:    '/register',
    highlight:  true,
    expert:     false,
  },
  {
    name:       'Expert',
    desc:       'Accompagnement VIP + Formation incluse.',
    price:      null,
    promo:      null,
    badge:      null,
    promoLabel: null,
    cta:        'Demander un devis',
    ctaHref:    'mailto:contact@agentpulse.cm',
    highlight:  false,
    expert:     true,
  },
] as const

function fmt(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA'
}

function Check() {
  return (
    <svg className="w-5 h-5 text-emerald-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}
function Cross() {
  return (
    <svg className="w-4 h-4 text-white/15 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#080F1D] text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 max-w-7xl mx-auto">
        <span className="font-black text-xl tracking-tight text-white">
          Agent<span className="text-blue-500">Pulse</span>
        </span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors">
            Connexion
          </Link>
          <Link
            href="/register"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Essai gratuit
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            Tarifs transparents
          </span>
          <h1 className="text-4xl sm:text-5xl font-black mt-5 mb-4 leading-tight">
            Le CRM qui fait<br className="hidden sm:block" /> grandir votre équipe
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            30 jours d'essai gratuit · Aucune carte requise · Résiliation à tout moment
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-7 flex flex-col ${
                plan.highlight
                  ? 'border-blue-500/50 bg-blue-500/5 shadow-xl shadow-blue-500/10'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">
                  ⭐ Recommandé
                </div>
              )}

              <div className="mb-5">
                <p className="text-lg font-bold text-white">{plan.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{plan.desc}</p>
              </div>

              {/* Pricing display */}
              {'expert' in plan && plan.expert ? (
                <div className="mb-4">
                  <span className="text-3xl font-black text-white">Sur devis</span>
                  <p className="text-xs text-white/30 mt-1 italic">Tarif personnalisé selon la taille de votre équipe</p>
                </div>
              ) : plan.promo ? (
                <div className="mb-2">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-3xl font-black text-white">{fmt(plan.promo)}</span>
                    <span className="text-white/30 text-sm">/mois</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/30 text-sm line-through">{fmt(plan.price!)}</span>
                    <span className="text-emerald-400 text-xs font-bold">
                      -{Math.round(((plan.price! - plan.promo) / plan.price!) * 100)}%
                    </span>
                  </div>
                  {'promoLabel' in plan && plan.promoLabel && (
                    <p className="text-[11px] text-white/25 italic">{plan.promoLabel}</p>
                  )}
                </div>
              ) : (
                <div className="mb-2">
                  <span className="text-3xl font-black text-white">{fmt(plan.price!)}</span>
                  <span className="text-white/30 text-sm">/mois</span>
                </div>
              )}

              {/* Badge promo */}
              {plan.badge && (
                <div className={`text-[11px] font-semibold px-2 py-1 rounded-lg mb-5 w-fit ${
                  plan.highlight
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  🎁 {plan.badge}
                </div>
              )}

              <div className="flex-1" />

              <Link
                href={plan.ctaHref}
                className={`mt-6 block text-center text-sm font-bold py-2.5 rounded-xl transition-colors ${
                  plan.highlight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6 text-center">Comparaison détaillée</h2>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/30 w-1/2">
                    Fonctionnalité
                  </th>
                  {PLANS.map(p => (
                    <th key={p.name} className={`px-4 py-4 text-center text-xs font-bold uppercase tracking-wider w-[16%] ${
                      p.highlight ? 'text-blue-400' : 'text-white/30'
                    }`}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map(([label, s, p, e], i) => (
                  <tr
                    key={String(label)}
                    className={`border-b border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                  >
                    <td className="px-5 py-3 text-white/70 text-sm">{label}</td>
                    {([s, p, e] as const).map((val, j) => (
                      <td key={j} className="px-4 py-3 text-center">
                        {typeof val === 'boolean' ? (
                          val ? <Check /> : <Cross />
                        ) : (
                          <span className="text-xs text-white/60 font-medium">{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Prix récap */}
                <tr className="bg-white/[0.03] border-t border-white/10">
                  <td className="px-5 py-4 text-white font-bold">Prix mensuel</td>
                  {PLANS.map(p => (
                    <td key={p.name} className="px-4 py-4 text-center">
                      {'expert' in p && p.expert ? (
                        <span className="text-xs text-amber-400 font-bold">Sur devis</span>
                      ) : p.promo ? (
                        <div>
                          <div className="text-white font-bold text-sm">{fmt(p.promo)}</div>
                          <div className="text-white/30 text-xs line-through">{fmt(p.price!)}</div>
                        </div>
                      ) : (
                        <span className="text-white font-bold text-sm">{fmt(p.price!)}</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ / Note bas */}
        <div className="mt-14 text-center text-white/30 text-sm space-y-2">
          <p>Tous les tarifs sont en FCFA · TVA non comprise · Facturation mensuelle</p>
          <p>
            Besoin d&apos;un devis Enterprise ?{' '}
            <a href="mailto:contact@agentpulse.cm" className="text-blue-400 hover:text-blue-300 transition-colors">
              contact@agentpulse.cm
            </a>
          </p>
          <p className="pt-4">
            <Link href="/login" className="text-white/20 hover:text-white/50 transition-colors text-xs">
              ← Retour à la connexion
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
