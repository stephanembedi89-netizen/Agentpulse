'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  ['Agents inclus',                 'Jusqu\'à 3',  'Jusqu\'à 15',   'Illimité'],
  ['Pipeline CRM',                  true,           true,            true],
  ['Tableau de bord agent',         true,           true,            true],
  ['Suivi des prospects',           true,           true,            true],
  ['Module Polices',                true,           true,            true],
  ['Superviseurs & validation',     false,          true,            true],
  ['Module Commissions',            false,          true,            true],
  ['Module Sinistres',              false,          true,            true],
  ['Alertes & KPIs équipe',        false,          true,            true],
  ['Classement agents',             false,          true,            true],
  ['Espace Manager',                false,          true,            true],
  ['Journal d\'activité',           false,          true,            true],
  ['Formation & onboarding VIP',   false,          false,           true],
  ['Accompagnement dédié',          false,          false,           true],
  ['Intégrations sur mesure',       false,          false,           true],
  ['SLA & contrat personnalisé',    false,          false,           true],
  ['Setup offert',                  true,           true,            true],
  ['Support',                       'Email',        'Prioritaire',   'VIP 24/7'],
] as const

const FAQ = [
  {
    q: 'Pourquoi le Pro est à 99 000 FCFA ?',
    a: 'C\'est notre tarif de lancement pour les 10 premières agences. Ce prix s\'applique pendant les 12 premiers mois. À partir du 13ème mois, le tarif normal de 149 000 FCFA/mois s\'applique. C\'est notre façon de récompenser les early adopters.',
  },
  {
    q: 'Est-ce que je peux annuler à tout moment ?',
    a: 'Oui. Aucun engagement. Vous pouvez résilier à tout moment depuis votre espace. Votre accès reste actif jusqu\'à la fin de la période en cours.',
  },
  {
    q: 'Comment fonctionne l\'essai de 14 jours ?',
    a: 'Vous créez votre compte gratuitement et accédez à toutes les fonctionnalités du forfait Pro pendant 14 jours. Aucune carte bancaire requise. À la fin de l\'essai, choisissez votre forfait ou votre compte est suspendu.',
  },
  {
    q: 'Quels modes de paiement acceptez-vous ?',
    a: 'MTN Mobile Money, Orange Money et virement bancaire FCFA. Facturation mensuelle ou annuelle selon votre choix.',
  },
  {
    q: 'Que se passe-t-il si j\'ai plus d\'agents que mon forfait ?',
    a: 'Vous pouvez ajouter des agents supplémentaires à la carte : +8 000 FCFA/agent pour le Starter, +6 000 FCFA/agent pour le Pro. L\'Expert inclut un nombre illimité dans le devis.',
  },
  {
    q: 'Le forfait Expert convient-il à mon agence ?',
    a: 'Le forfait Expert est conçu pour les agences de 20 agents ou plus qui ont besoin d\'un accompagnement sur mesure, de formations, et d\'intégrations spécifiques. En dessous de 20 agents, le Pro est largement suffisant.',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' FCFA' }

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
  const [annual,   setAnnual]   = useState(false)
  const [openFaq,  setOpenFaq]  = useState<number | null>(null)

  // Prix
  const starterMonthly = 49_000
  const proPromo       = 99_000
  const proNormal      = 149_000
  const starterAnnual  = Math.round(starterMonthly * 12 * 0.8)   // 470 400
  const proAnnual      = 950_000
  const starterPerMo   = Math.round(starterAnnual / 12)          // 39 200
  const proPerMo       = Math.round(proAnnual / 12)              // ~79 167

  return (
    <div className="min-h-screen bg-[#080F1D] text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 max-w-7xl mx-auto">
        <span className="font-black text-xl tracking-tight">
          Agent<span className="text-blue-500">Pulse</span>
        </span>
        <div className="flex items-center gap-4">
          <Link href="/demo" className="text-sm text-white/50 hover:text-white transition-colors">
            Essai gratuit
          </Link>
          <Link href="/login" className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
            Connexion
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
            Le CRM qui fait grandir<br className="hidden sm:block" /> votre équipe
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            14 jours d&apos;essai gratuit · Aucune carte requise · Résiliation à tout moment
          </p>
        </div>

        {/* Toggle mensuel / annuel */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-semibold transition-colors ${!annual ? 'text-white' : 'text-white/40'}`}>Mensuel</span>
          <button
            onClick={() => setAnnual(a => !a)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-emerald-500' : 'bg-white/20'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${annual ? 'left-7' : 'left-1'}`} />
          </button>
          <span className={`text-sm font-semibold transition-colors ${annual ? 'text-white' : 'text-white/40'}`}>Annuel</span>
          {annual && (
            <span className="text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded-full">−20%</span>
          )}
        </div>

        {/* ── Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">

          {/* STARTER */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7 flex flex-col">
            <p className="text-lg font-bold text-white mb-1">Starter</p>
            <p className="text-xs text-white/40 mb-5">Idéal pour tester. On vous offre le setup.</p>
            {annual ? (
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">{fmt(starterAnnual)}</span>
                  <span className="text-white/30 text-sm">/an</span>
                </div>
                <p className="text-white/40 text-xs">soit {fmt(starterPerMo)}/mois</p>
                <p className="text-emerald-400 text-xs font-bold mt-0.5">Économie : {fmt(starterMonthly * 12 - starterAnnual)}</p>
              </div>
            ) : (
              <div className="mb-4">
                <span className="text-3xl font-black">{fmt(starterMonthly)}</span>
                <span className="text-white/30 text-sm">/mois</span>
              </div>
            )}
            <p className="text-[11px] text-white/25 mb-5">+8 000 FCFA/agent au-delà de 3</p>
            <div className="flex-1" />
            <Link href="/demo" className="block text-center text-sm font-bold py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors">
              Commencer l&apos;essai
            </Link>
          </div>

          {/* PRO */}
          <div className="relative rounded-2xl border border-blue-500/50 bg-blue-500/5 shadow-xl shadow-blue-500/10 p-7 flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">
              ⭐ Recommandé
            </div>
            <p className="text-lg font-bold text-white mb-1">Pro</p>
            <p className="text-xs text-white/40 mb-5">Le prix spécial pour nos 10 premières agences.</p>
            {annual ? (
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">{fmt(proAnnual)}</span>
                  <span className="text-white/30 text-sm">/an</span>
                </div>
                <p className="text-white/40 text-xs">soit {fmt(proPerMo)}/mois</p>
                <p className="text-emerald-400 text-xs font-bold mt-0.5">Économie : {fmt(proPromo * 12 - proAnnual)}</p>
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-3xl font-black">{fmt(proPromo)}</span>
                  <span className="text-white/30 text-sm">/mois</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/30 text-sm line-through">{fmt(proNormal)}</span>
                  <span className="text-emerald-400 text-xs font-bold">−33%</span>
                </div>
                <p className="text-[11px] text-white/30 italic">
                  les 12 premiers mois · puis {fmt(proNormal)}/mois à partir du 13ème mois
                </p>
              </div>
            )}
            <div className="text-[11px] font-semibold px-2 py-1 rounded-lg mb-3 w-fit bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              🎁 Offre Lundi — 10 premières agences
            </div>
            <p className="text-[11px] text-white/25 mb-5">+6 000 FCFA/agent au-delà de 15</p>
            <div className="flex-1" />
            <Link href="/demo" className="block text-center text-sm font-bold py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors">
              Démarrer en Pro
            </Link>
          </div>

          {/* EXPERT */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7 flex flex-col">
            <p className="text-lg font-bold text-white mb-1">Expert</p>
            <p className="text-xs text-white/40 mb-5">Accompagnement VIP + Formation incluse.</p>
            <div className="mb-4">
              <p className="text-3xl font-black text-white">Devis personnalisé</p>
              <p className="text-white/40 text-sm mt-1">Réponse sous 24h</p>
              <p className="text-[11px] text-white/25 mt-2 italic">
                Pour les agences de 20+ agents.<br />Tarif sur mesure selon votre équipe.
              </p>
            </div>
            <p className="text-[11px] text-white/25 mb-5">Agents supplémentaires inclus dans le devis</p>
            <div className="flex-1" />
            <a
              href="mailto:contact@agentpulse.cm"
              className="block text-center text-sm font-bold py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
            >
              Demander un devis
            </a>
          </div>
        </div>

        {/* ── Tableau comparatif ── */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Comparaison détaillée</h2>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/30 w-1/2">Fonctionnalité</th>
                  {['Starter', 'Pro', 'Expert'].map((n, i) => (
                    <th key={n} className={`px-4 py-4 text-center text-xs font-bold uppercase tracking-wider w-[16%] ${i === 1 ? 'text-blue-400' : 'text-white/30'}`}>{n}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map(([label, s, p, e], i) => (
                  <tr key={String(label)} className={`border-b border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                    <td className="px-5 py-3 text-white/70 text-sm">{label}</td>
                    {([s, p, e] as const).map((val, j) => (
                      <td key={j} className="px-4 py-3 text-center">
                        {typeof val === 'boolean' ? (val ? <Check /> : <Cross />) : <span className="text-xs text-white/60 font-medium">{val}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-white/[0.03] border-t border-white/10">
                  <td className="px-5 py-4 text-white font-bold">Prix {annual ? 'annuel' : 'mensuel'}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-white font-bold text-sm">{annual ? fmt(starterAnnual) : fmt(starterMonthly)}</div>
                    {annual && <div className="text-white/30 text-xs">{fmt(starterPerMo)}/mois</div>}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-white font-bold text-sm">{annual ? fmt(proAnnual) : fmt(proPromo)}</div>
                    {!annual && <div className="text-white/30 text-xs line-through">{fmt(proNormal)}</div>}
                    {annual  && <div className="text-white/30 text-xs">{fmt(proPerMo)}/mois</div>}
                  </td>
                  <td className="px-4 py-4 text-center"><span className="text-xs text-amber-400 font-bold">Sur devis</span></td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-5 py-3 text-white/40 text-sm">Agent supplémentaire</td>
                  <td className="px-4 py-3 text-center text-xs text-white/40">+8 000 FCFA</td>
                  <td className="px-4 py-3 text-center text-xs text-white/40">+6 000 FCFA</td>
                  <td className="px-4 py-3 text-center text-xs text-amber-400">Dans le devis</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── ROI ── */}
        <div className="mb-16 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Retour sur investissement</span>
            <h2 className="text-2xl font-black text-white mt-2">1 police suffit à rentabiliser votre abonnement</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-5xl font-black text-emerald-400">×20</p>
              <p className="text-white/50 text-sm mt-2">retour moyen sur l&apos;abonnement Pro au prix de lancement</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-black text-blue-400">+2</p>
              <p className="text-white/50 text-sm mt-2">polices supplémentaires par agent grâce au suivi structuré</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-black text-violet-400">3j</p>
              <p className="text-white/50 text-sm mt-2">délai moyen de rentabilité après la première police signée</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-emerald-500/10 text-center">
            <p className="text-white/30 text-xs">
              Exemple : 1 agent signe 1 police à 150 000 FCFA de prime → commission 5% = 7 500 FCFA.<br />
              Au bout de 14 polices, l&apos;abonnement Pro est remboursé pour le mois en cours.
            </p>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Questions fréquentes</h2>
          <div className="flex flex-col gap-3">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-semibold text-white">{item.q}</span>
                  <svg
                    className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-white/50 leading-relaxed border-t border-white/5">
                    <p className="pt-3">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Formulaire essai ── */}
        <div id="essai" className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8 text-center">
          <h2 className="text-2xl font-black text-white mb-2">Prêt à démarrer ?</h2>
          <p className="text-white/40 mb-6">14 jours gratuits, aucune carte requise.</p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
          >
            Créer mon compte gratuit →
          </Link>
          <p className="text-white/20 text-xs mt-4">
            Questions ? <a href="mailto:contact@agentpulse.cm" className="text-blue-400 hover:text-blue-300 transition-colors">contact@agentpulse.cm</a>
          </p>
        </div>

        {/* Footer minimal */}
        <div className="mt-12 text-center text-white/20 text-xs space-y-1">
          <p>Tous les tarifs en FCFA · TVA non comprise · Facturation mensuelle ou annuelle</p>
          <p>
            <Link href="/login" className="hover:text-white/50 transition-colors">← Retour à la connexion</Link>
          </p>
        </div>

      </div>
    </div>
  )
}
