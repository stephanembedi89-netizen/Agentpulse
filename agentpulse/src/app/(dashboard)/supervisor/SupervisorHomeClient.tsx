'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  banner: {
    policesEmisesMois: number
    primeMoyenne: number
    tauxGlobal: number
    objectifMensuel: number
    dateAujourdhui: string
  }
  pipeline: Record<string, number>
  ratios: {
    tauxGlobal: number
    primeJournaliere: number
    soumisesEmises: number
    tauxTerrain: number
    tauxQualification: number
    livraisons: number
  }
}

interface Top3Agent {
  id: string
  name: string
  policesMois: number
  tauxGlobal: number
  total: number
}

type ActivityType = 'CONTACT' | 'ENTRETIEN' | 'ENTREVUE' | 'NOTE'

// ─── Config saisie rapide ─────────────────────────────────────────────────────
const SAISIE_STAGES: {
  key: string; label: string; activityType: ActivityType; note?: string
  color: string; icon: string
}[] = [
  { key: 'CONTACT',   label: 'Contact',        activityType: 'CONTACT',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z' },
  { key: 'ENTRETIEN', label: 'Entretien',      activityType: 'ENTRETIEN',
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    icon: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155' },
  { key: 'ENTREVUE',  label: 'Entrevue',       activityType: 'ENTREVUE',
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z' },
  { key: 'SOUMISE',   label: 'Police soumise', activityType: 'NOTE', note: 'Soumission de police',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  { key: 'EMISE',     label: 'Police émise',   activityType: 'NOTE', note: 'Police émise',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'LIVRAISON', label: 'Livraison',      activityType: 'NOTE', note: 'Livraison effectuée',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
]

const RANK_COLORS = [
  'text-amber-400 bg-amber-500/10 border-amber-500/30',
  'text-gray-300 bg-gray-500/10 border-gray-500/20',
  'text-orange-500 bg-orange-700/10 border-orange-700/20',
]

function formatFcfa(n: number) { return n === 0 ? '—' : n.toLocaleString('fr-FR') + ' FCFA' }
function pct(n: number) { return `${n} %` }
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function SupervisorHomeClient({
  stats, top3,
}: { stats: Stats; top3: Top3Agent[] }) {
  const { banner, pipeline, ratios } = stats

  const [quickCounts, setQuickCounts] = useState<Record<string, number>>(
    Object.fromEntries(SAISIE_STAGES.map(s => [s.key, 0]))
  )
  const [flashing, setFlashing] = useState<string | null>(null)
  const [toast, setToast]       = useState<string | null>(null)

  const progress = Math.min(
    Math.round((banner.policesEmisesMois / banner.objectifMensuel) * 100),
    100
  )

  const maxPolices = Math.max(...top3.map(a => a.policesMois), 1)

  async function logActivity(stage: typeof SAISIE_STAGES[number]) {
    setQuickCounts(c => ({ ...c, [stage.key]: c[stage.key] + 1 }))
    setFlashing(stage.key)
    setTimeout(() => setFlashing(null), 600)
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: stage.activityType, note: stage.note }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setQuickCounts(c => ({ ...c, [stage.key]: Math.max(0, c[stage.key] - 1) }))
      setToast('Erreur lors de l\'enregistrement')
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-red-950/80 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* ── Bannière performance personnelle ── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0D1626] via-emerald-950/40 to-[#0D1626] border border-emerald-500/20 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.1),transparent_60%)] pointer-events-none" />
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/60 mb-0.5">Mon activité</p>
            <h1 className="text-lg font-bold text-white">Tableau de bord</h1>
          </div>
          <span className="text-xs text-white/40 capitalize">{formatDate(banner.dateAujourdhui)}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-[11px] text-white/40 mb-1">Polices émises ce mois</p>
            <p className="text-xl font-bold text-emerald-300">{banner.policesEmisesMois}</p>
            <p className="text-[10px] text-white/25 mt-0.5">objectif : {banner.objectifMensuel}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/40 mb-1">Prime moyenne</p>
            <p className="text-xl font-bold text-amber-300">{formatFcfa(banner.primeMoyenne)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/40 mb-1">Taux global</p>
            <p className="text-xl font-bold text-blue-300">{pct(banner.tauxGlobal)}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-white/40">Progression mensuelle</span>
            <span className="text-xs font-bold text-emerald-400">{progress} %</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progress >= 100 ? 'bg-emerald-500' : 'bg-emerald-600'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-white/25 mt-1">
            {banner.policesEmisesMois} / {banner.objectifMensuel} polices émises ce mois
          </p>
        </div>
      </div>

      {/* ── Saisie rapide + Top 3 équipe ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Saisie rapide */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Saisie rapide</h2>
            <Link href="/supervisor/pipeline" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              Voir pipeline →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {SAISIE_STAGES.map(stage => {
              const isFlash = flashing === stage.key
              return (
                <div key={stage.key} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${stage.color}`}>
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stage.icon} />
                  </svg>
                  <span className="flex-1 text-sm font-medium text-white/80">{stage.label}</span>
                  <span className="text-xs font-mono font-bold text-white/50 w-5 text-center">
                    {pipeline[stage.key] ?? 0}
                  </span>
                  {quickCounts[stage.key] > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-white/60">
                      +{quickCounts[stage.key]}
                    </span>
                  )}
                  <button
                    onClick={() => logActivity(stage)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold border transition-all duration-150 ${
                      isFlash
                        ? 'scale-125 bg-white/20 border-white/30 text-white'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    {isFlash ? '✓' : '+'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top 3 équipe */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Top équipe ce mois</h2>
            <Link href="/supervisor/agents" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              Voir tout →
            </Link>
          </div>

          {top3.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-10">
              <p className="text-xs text-white/25">Aucun agent dans votre équipe</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {top3.map((agent, i) => (
                <div key={agent.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${RANK_COLORS[i]}`}>
                  <span className="text-lg font-black w-6 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{agent.name}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-current opacity-60"
                        style={{ width: `${Math.round((agent.policesMois / maxPolices) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{agent.policesMois} police{agent.policesMois > 1 ? 's' : ''}</p>
                    <p className="text-[11px] opacity-60">{agent.tauxGlobal} %</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Ratios du jour ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm font-bold text-white mb-4">Ratios du jour</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Taux global',        value: pct(ratios.tauxGlobal),        hint: 'Livraisons / total',       color: 'text-blue-400' },
            { label: 'Prime journalière',   value: formatFcfa(ratios.primeJournaliere), hint: "Livrées aujourd'hui", color: 'text-amber-400' },
            { label: 'Soumises → émises',  value: pct(ratios.soumisesEmises),    hint: 'Taux de transformation',   color: 'text-emerald-400' },
            { label: 'Taux terrain',        value: pct(ratios.tauxTerrain),       hint: 'Entretiens / contacts',    color: 'text-cyan-400' },
            { label: 'Taux qualification',  value: pct(ratios.tauxQualification), hint: 'Entrevues / entretiens',   color: 'text-violet-400' },
            { label: 'Livraisons',          value: String(ratios.livraisons),     hint: 'Total pipeline',           color: 'text-orange-400' },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[11px] text-white/40 mb-1">{k.label}</p>
              <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{k.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
