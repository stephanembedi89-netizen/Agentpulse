'use client'

import { useState } from 'react'

type Policy = {
  id: string
  policyNumber: string
  productType: string
  premium: number
  status: string
  startDate: string
  endDate: string
  createdAt: string
  prospect: { firstName: string; lastName: string }
  agent: { id: string; name: string }
}

const STATUS_LABEL: Record<string, string> = {
  SOUMISE:  'En attente',
  EMISE:    'Émise',
  LIVREE:   'Livrée',
  REJETEE:  'Retournée',
}
const STATUS_COLOR: Record<string, string> = {
  SOUMISE:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
  EMISE:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  LIVREE:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
  REJETEE:  'text-red-400 bg-red-500/10 border-red-500/20',
}

const FILTERS = [
  { key: 'ALL',     label: 'Toutes' },
  { key: 'SOUMISE', label: 'En attente' },
  { key: 'EMISE',   label: 'Émises' },
  { key: 'LIVREE',  label: 'Livrées' },
]

export default function PolicesManagerClient({ initialPolicies }: { initialPolicies: Policy[] }) {
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies)
  const [filter, setFilter]     = useState('ALL')
  const [acting, setActing]     = useState<string | null>(null)
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  async function act(policyId: string, action: 'VALIDER' | 'RETOURNER') {
    setActing(policyId + action)
    try {
      const r = await fetch(`/api/policies/${policyId}/validate`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action }),
      })
      if (r.ok) {
        showToast(action === 'VALIDER' ? 'Police validée ✓' : 'Police retournée', true)
        // Refresh list
        const r2 = await fetch('/api/manager/polices')
        if (r2.ok) setPolicies(await r2.json())
        else {
          // Optimistic update
          if (action === 'VALIDER') {
            setPolicies(ps => ps.map(p => p.id === policyId ? { ...p, status: 'EMISE' } : p))
          } else {
            setPolicies(ps => ps.filter(p => p.id !== policyId))
          }
        }
      } else {
        const d = await r.json().catch(() => ({}))
        showToast(d.error ?? 'Erreur', false)
      }
    } catch {
      showToast('Erreur réseau', false)
    } finally {
      setActing(null)
    }
  }

  const filtered = filter === 'ALL' ? policies : policies.filter(p => p.status === filter)

  const counts = {
    ALL:     policies.length,
    SOUMISE: policies.filter(p => p.status === 'SOUMISE').length,
    EMISE:   policies.filter(p => p.status === 'EMISE').length,
    LIVREE:  policies.filter(p => p.status === 'LIVREE').length,
  }

  return (
    <div className="space-y-6">

      {toast && (
        <div className={`fixed top-4 right-4 z-50 text-sm px-4 py-3 rounded-xl border shadow-xl ${
          toast.ok ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
                   : 'bg-red-950/90 border-red-500/40 text-red-300'
        }`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Polices</h1>
          <p className="text-sm text-gray-400 mt-1">
            {counts.SOUMISE > 0
              ? `${counts.SOUMISE} police${counts.SOUMISE > 1 ? 's' : ''} en attente de validation`
              : 'Toutes les polices de votre équipe'}
          </p>
        </div>
        {counts.SOUMISE > 0 && (
          <span className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {counts.SOUMISE} à valider
          </span>
        )}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === f.key
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
            }`}
          >
            {f.label} ({counts[f.key as keyof typeof counts] ?? policies.length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-3xl mb-3">📋</p>
          <p>Aucune police dans cette catégorie</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const busy = acting?.startsWith(p.id)
            return (
              <div key={p.id}
                className={`bg-white/5 border rounded-xl p-5 ${
                  p.status === 'SOUMISE' ? 'border-amber-500/20' : 'border-white/10'
                }`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono text-sm font-semibold text-white">{p.policyNumber}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-md border ${STATUS_COLOR[p.status] ?? ''}`}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{p.productType}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {p.prospect.firstName} {p.prospect.lastName}
                      {' · '}Agent : {p.agent.name}
                      {' · '}Prime : <span className="text-white font-medium">{p.premium.toLocaleString('fr-FR')} FCFA</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Du {new Date(p.startDate).toLocaleDateString('fr-FR')} au {new Date(p.endDate).toLocaleDateString('fr-FR')}
                      {' · '}Soumise le {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  {p.status === 'SOUMISE' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        disabled={!!busy}
                        onClick={() => act(p.id, 'VALIDER')}
                        className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                      >
                        {acting === p.id + 'VALIDER' ? '...' : '✓ Valider'}
                      </button>
                      <button
                        disabled={!!busy}
                        onClick={() => {
                          if (confirm(`Retourner la police ${p.policyNumber} pour correction ?`)) {
                            act(p.id, 'RETOURNER')
                          }
                        }}
                        className="px-4 py-2 text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                      >
                        {acting === p.id + 'RETOURNER' ? '...' : '↩ Retourner'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
