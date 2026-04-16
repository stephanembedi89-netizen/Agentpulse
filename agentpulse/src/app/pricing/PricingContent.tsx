'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Data ─────────────────────────────────────────────────────────────────────

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
  ['Alertes & KPIs équipe',          false,          true,            true],
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

interface Plan {
  name: string
  desc: string
  pitch: string
  monthlyBase: number | null    // prix public (barré si promo)
  monthlyPromo: number | null   // prix promo affiché
  annualTotal: number | null    // versement annuel unique
  annualMonthly: number | null  // équivalent mensuel
  annualSaving: number | null   // économie vs promo × 12
  badge: string | null
  promoLabel: string | null
  agentExtra: string | null     // tarif agent sup.
  cta: string
  ctaHref: string
  highlight: boolean
  expert: boolean
}

const PLANS: Plan[] = [
  {
    name:          'Starter',
    desc:          'Idéal pour tester. On vous offre le setup.',
    pitch:         'Lancez-vous sans risque avec 30 jours d\'essai gratuit et un setup offert.',
    monthlyBase:   49_000,
    monthlyPromo:  null,
    annualTotal:   Math.round(49_000 * 12 * 0.8),   // 470 400
    annualMonthly: Math.round(49_000 * 0.8),         // 39 200
    annualSaving:  Math.round(49_000 * 12 * 0.2),    // 117 600
    badge:         null,
    promoLabel:    null,
    agentExtra:    '+8 000 FCFA/agent au-delà de 3',
    cta:           'Commencer l\'essai',
    ctaHref:       '/register',
    highlight:     false,
    expert:        false,
  },
  {
    name:          'Pro',
    desc:          'Le prix spécial pour nos 10 premières agences.',
    pitch:         'Toutes les fonctionnalités pour piloter votre équipe commerciale au complet.',
    monthlyBase:   149_000,
    monthlyPromo:  99_000,
    annualTotal:   950_000,
    annualMonthly: Math.round(950_000 / 12),         // ~79 167
    annualSaving:  Math.round(99_000 * 12 - 950_000), // ~238 000
    badge:         'Offre Lundi — 6 premiers mois',
    promoLabel:    'pendant 6 mois, puis 149 000 FCFA/mois',
    agentExtra:    '+6 000 FCFA/agent au-delà de 15',
    cta:           'Démarrer en Pro',
    ctaHref:       '/register',
    highlight:     true,
    expert:        false,
  },
  {
    name:          'Expert',
    desc:          'Accompagnement VIP + Formation incluse.',
    pitch:         'Pour les grandes sociétés d\'assurance avec 20+ agents. Tarif sur mesure.',
    monthlyBase:   null,
    monthlyPromo:  null,
    annualTotal:   null,
    annualMonthly: null,
    annualSaving:  null,
    badge:         null,
    promoLabel:    null,
    agentExtra:    null,
    cta:           'Demander un devis',
    ctaHref:       'mailto:contact@agentpulse.cm',
    highlight:     false,
    expert:        true,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function PricingContent() {
  const [annual, setAnnual] = useState(false)

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
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            Tarifs transparents
          </span>
          <h1 className="text-4xl sm:text-5xl font-black mt-5 mb-4 leading-tight">
            Le CRM qui fait<br className="hidden sm:block" /> grandir votre équipe
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            30 jours d&apos;essai gratuit · Aucune carte requise · Résiliation à tout moment
          </p>
        </div>

        {/* Toggle mensuel / annuel */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-semibold transition-colors ${!annual ? 'text-white' : 'text-white/40'}`}>
            Mensuel
          </span>
          <button
            onClick={() => setAnnual(a => !a)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-emerald-500' : 'bg-white/20'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${annual ? 'left-7' : 'left-1'}`} />
          </button>
          <span className={`text-sm font-semibold transition-colors ${annual ? 'text-white' : 'text-white/40'}`}>
            Annuel
          </span>
          {annual && (
            <span className="text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
              −20 %
            </span>
          )}
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

              {/* Name + desc */}
              <div className="mb-5">
                <p className="text-lg font-bold text-white">{plan.name}</p>
                <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{plan.desc}</p>
              </div>

              {/* Pricing */}
              {plan.expert ? (
                <div className="mb-4">
                  <p className="text-3xl font-black text-white">Sur devis</p>
                  <p className="text-xs text-amber-400 font-semibold mt-1">
                    Forfait d&apos;intégration : {fmt(249_000)}
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    puis à partir de {fmt(200_000)}/mois selon votre équipe
                  </p>
                  <p className="text-[11px] text-white/20 mt-1 italic">
                    Moins de 20 agents ? Le forfait Pro est fait pour vous.
                  </p>
                </div>
              ) : annual ? (
                // ── Annuel ──
                <div className="mb-2">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-3xl font-black text-white">{fmt(plan.annualTotal!)}</span>
                    <span className="text-white/30 text-sm">/an</span>
                  </div>
                  <p className="text-white/40 text-xs mb-1">
                    soit {fmt(plan.annualMonthly!)}/mois
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-xs font-bold">
                      Économie : {fmt(plan.annualSaving!)}
                    </span>
                  </div>
                  {plan.monthlyPromo && (
                    <p className="text-[11px] text-white/20 mt-1 line-through">
                      vs {fmt(plan.monthlyPromo)}/mois × 12
                    </p>
                  )}
                </div>
              ) : (
                // ── Mensuel ──
                <div className="mb-2">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-3xl font-black text-white">
                      {fmt(plan.monthlyPromo ?? plan.monthlyBase!)}
                    </span>
                    <span className="text-white/30 text-sm">/mois</span>
                  </div>
                  {plan.monthlyPromo && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white/30 text-sm line-through">{fmt(plan.monthlyBase!)}</span>
                      <span className="text-emerald-400 text-xs font-bold">
                        −{Math.round(((plan.monthlyBase! - plan.monthlyPromo) / plan.monthlyBase!) * 100)}%
                      </span>
                    </div>
                  )}
                  {plan.promoLabel && (
                    <p className="text-[11px] text-white/25 italic">{plan.promoLabel}</p>
                  )}
                </div>
              )}

              {/* Badge promo */}
              {plan.badge && !annual && (
                <div className="text-[11px] font-semibold px-2 py-1 rounded-lg mb-3 w-fit bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  🎁 {plan.badge}
                </div>
              )}

              {/* Prix par agent extra */}
              {plan.agentExtra && (
                <p className="text-[11px] text-white/25 mb-4 mt-1">
                  {plan.agentExtra}
                </p>
              )}

              {/* Pitch */}
              <p className="text-xs text-white/30 leading-relaxed mb-5">{plan.pitch}</p>

              <div className="flex-1" />

              <Link
                href={plan.ctaHref}
                className={`block text-center text-sm font-bold py-2.5 rounded-xl transition-colors ${
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

        {/* Tableau comparatif */}
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
                {FEATURES.map(([label, s, pr, e], i) => (
                  <tr key={String(label)} className={`border-b border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                    <td className="px-5 py-3 text-white/70 text-sm">{label}</td>
                    {([s, pr, e] as const).map((val, j) => (
                      <td key={j} className="px-4 py-3 text-center">
                        {typeof val === 'boolean'
                          ? (val ? <Check /> : <Cross />)
                          : <span className="text-xs text-white/60 font-medium">{val}</span>}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Ligne prix récap */}
                <tr className="bg-white/[0.03] border-t border-white/10">
                  <td className="px-5 py-4 text-white font-bold">
                    Prix {annual ? 'annuel' : 'mensuel'}
                  </td>
                  {PLANS.map(p => (
                    <td key={p.name} className="px-4 py-4 text-center">
                      {p.expert ? (
                        <span className="text-xs text-amber-400 font-bold">Sur devis</span>
                      ) : annual ? (
                        <div>
                          <div className="text-white font-bold text-sm">{fmt(p.annualTotal!)}</div>
                          <div className="text-emerald-400 text-[11px]">−20%</div>
                        </div>
                      ) : p.monthlyPromo ? (
                        <div>
                          <div className="text-white font-bold text-sm">{fmt(p.monthlyPromo)}</div>
                          <div className="text-white/30 text-xs line-through">{fmt(p.monthlyBase!)}</div>
                        </div>
                      ) : (
                        <span className="text-white font-bold text-sm">{fmt(p.monthlyBase!)}</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Ligne agent supplémentaire */}
                <tr className="border-t border-white/5">
                  <td className="px-5 py-3 text-white/40 text-sm">Agent supplémentaire</td>
                  <td className="px-4 py-3 text-center text-xs text-white/40">+8 000 FCFA</td>
                  <td className="px-4 py-3 text-center text-xs text-white/40">+6 000 FCFA</td>
                  <td className="px-4 py-3 text-center text-xs text-amber-400">Inclus (illimité)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Note bas */}
        <div className="mt-14 text-center text-white/30 text-sm space-y-2">
          <p>Tous les tarifs sont en FCFA · TVA non comprise · Facturation mensuelle ou annuelle</p>
          <p>
            Besoin d&apos;un devis Expert ?{' '}
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
