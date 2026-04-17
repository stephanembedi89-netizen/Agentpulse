'use client'

import { useState, useEffect, useMemo } from 'react'

interface SnapshotData {
  agentName:       string
  supervisorName:  string | null
  contacts:        number
  polices:         number
  primes:          number
  taux:            number
  commissions:     number
  activitiesCount: number
}

interface Snapshot {
  id:          string
  agentId:     string
  periodStart: string
  periodEnd:   string
  data:        SnapshotData
  createdAt:   string
}

interface Period {
  key:   string
  label: string
  start: string
  end:   string
  rows:  Snapshot[]
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function buildCsv(rows: Snapshot[]): string {
  const BOM = '\uFEFF'
  const headers = [
    'Période début', 'Période fin',
    'Agent', 'Superviseur',
    'Contacts', 'Polices', 'Primes (FCFA)',
    'Taux (%)', 'Commissions (FCFA)', 'Activités',
  ]
  const lines = rows.map(s => [
    fmt(s.periodStart),
    fmt(s.periodEnd),
    s.data.agentName,
    s.data.supervisorName ?? '—',
    s.data.contacts,
    s.data.polices,
    s.data.primes,
    s.data.taux,
    s.data.commissions,
    s.data.activitiesCount,
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
  return BOM + [headers.join(';'), ...lines].join('\r\n')
}

function download(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function RapportsClient() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading]     = useState(true)
  const [generating, setGenerating] = useState(false)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)
  const [openPeriod, setOpenPeriod] = useState<string | null>(null)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/manager/rapports')
      const d = await r.json()
      setSnapshots(d)
      if (d.length > 0) setOpenPeriod(d[0].periodEnd)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function generate() {
    setGenerating(true)
    try {
      const r = await fetch('/api/manager/rapports', { method: 'POST' })
      const j = await r.json()
      if (!r.ok) {
        showToast(j.error ?? 'Erreur lors de la génération', false)
      } else {
        showToast(`${j.snapshotsCreated} snapshot(s) créé(s)`, true)
        await load()
      }
    } finally {
      setGenerating(false)
    }
  }

  // Group by periodEnd
  const periods = useMemo<Period[]>(() => {
    const map = new Map<string, Snapshot[]>()
    for (const s of snapshots) {
      const key = s.periodEnd.slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return Array.from(map.entries()).map(([key, rows]) => ({
      key,
      label: `${fmt(rows[0].periodStart)} → ${fmt(rows[0].periodEnd)}`,
      start: rows[0].periodStart,
      end:   rows[0].periodEnd,
      rows,
    }))
  }, [snapshots])

  function exportPeriod(period: Period) {
    download(buildCsv(period.rows), `rapport-agents-${period.key}.csv`)
  }

  function exportAll() {
    download(buildCsv(snapshots), `rapport-agents-complet.csv`)
  }

  return (
    <div className="flex flex-col gap-5">

      {toast && (
        <div className={`fixed top-4 right-4 z-50 border text-sm px-4 py-3 rounded-xl shadow-xl ${
          toast.ok
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/80 border-red-500/40 text-red-300'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Rapports d&apos;activité</h1>
          <p className="text-xs text-white/30 mt-0.5">
            Snapshots générés automatiquement tous les 14 jours — exportables en CSV / Excel
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {snapshots.length > 0 && (
            <button
              onClick={exportAll}
              className="flex items-center gap-1.5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              <DownloadIcon />
              Tout exporter
            </button>
          )}
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            {generating ? (
              <span className="animate-pulse">Génération…</span>
            ) : (
              <>
                <RefreshIcon />
                Générer maintenant
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center text-white/30 py-16 text-sm">Chargement…</div>
      ) : periods.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center flex flex-col items-center gap-3">
          <p className="text-white/30 text-sm">Aucun rapport enregistré</p>
          <p className="text-white/20 text-xs max-w-sm">
            Les snapshots sont générés automatiquement le 1er et le 15 de chaque mois.
            Cliquez sur &quot;Générer maintenant&quot; pour créer le premier rapport.
          </p>
          <p className="text-amber-400/60 text-xs mt-1">
            ⚠ Assurez-vous d&apos;avoir exécuté <code className="font-mono">npx prisma db push</code> sur votre base de données.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {periods.map(period => (
            <div key={period.key} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">

              {/* Period header */}
              <button
                onClick={() => setOpenPeriod(openPeriod === period.key ? null : period.key)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold text-sm">{period.label}</span>
                  <span className="text-xs text-white/30 bg-white/5 rounded-md px-2 py-0.5">
                    {period.rows.length} agent{period.rows.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); exportPeriod(period) }}
                    className="flex items-center gap-1.5 border border-white/10 hover:border-white/20 text-white/50 hover:text-white text-xs px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <DownloadIcon />
                    CSV
                  </button>
                  <span className={`text-white/30 transition-transform ${openPeriod === period.key ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </div>
              </button>

              {/* Period table */}
              {openPeriod === period.key && (
                <div className="border-t border-white/10 overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr className="bg-white/[0.03]">
                        {['Agent', 'Superviseur', 'Contacts', 'Polices', 'Primes (FCFA)', 'Taux', 'Commissions', 'Activités'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {period.rows
                        .slice()
                        .sort((a, b) => b.data.polices - a.data.polices)
                        .map(s => (
                          <tr key={s.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-2.5 text-white font-medium">{s.data.agentName}</td>
                            <td className="px-4 py-2.5 text-white/40 text-xs">{s.data.supervisorName ?? '—'}</td>
                            <td className="px-4 py-2.5 text-blue-400 font-semibold">{s.data.contacts}</td>
                            <td className="px-4 py-2.5 text-violet-400 font-semibold">{s.data.polices}</td>
                            <td className="px-4 py-2.5 text-amber-400 font-semibold text-xs">{s.data.primes.toLocaleString('fr-FR')}</td>
                            <td className="px-4 py-2.5">
                              <span className={`text-xs font-semibold ${
                                s.data.taux >= 40 ? 'text-emerald-400'
                                : s.data.taux >= 20 ? 'text-blue-400'
                                : 'text-red-400'
                              }`}>
                                {s.data.taux}%
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-emerald-400 font-semibold text-xs">{s.data.commissions.toLocaleString('fr-FR')}</td>
                            <td className="px-4 py-2.5 text-white/40">{s.data.activitiesCount}</td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-white/10 bg-white/[0.02]">
                        <td className="px-4 py-2 text-xs font-bold text-white/40 uppercase">Totaux</td>
                        <td />
                        <td className="px-4 py-2 text-blue-400 font-bold text-sm">
                          {period.rows.reduce((s, r) => s + r.data.contacts, 0)}
                        </td>
                        <td className="px-4 py-2 text-violet-400 font-bold text-sm">
                          {period.rows.reduce((s, r) => s + r.data.polices, 0)}
                        </td>
                        <td className="px-4 py-2 text-amber-400 font-bold text-xs">
                          {period.rows.reduce((s, r) => s + r.data.primes, 0).toLocaleString('fr-FR')}
                        </td>
                        <td />
                        <td className="px-4 py-2 text-emerald-400 font-bold text-xs">
                          {period.rows.reduce((s, r) => s + r.data.commissions, 0).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-2 text-white/40 font-bold text-sm">
                          {period.rows.reduce((s, r) => s + r.data.activitiesCount, 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}
