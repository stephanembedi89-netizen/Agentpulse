'use client'

import { useState } from 'react'

interface Commission {
  id: string
  amount: number | null
  rate: number | null
  status: string
  createdAt: string
  policy: {
    policyNumber: string
    productType: string
    premium: number | null
    prospect: { firstName: string; lastName: string }
    agent: { name: string }
  }
}

const STATUS_STYLE: Record<string, string> = {
  ATTENTE: 'bg-amber-500/20 text-amber-400',
  VALIDE:  'bg-emerald-500/20 text-emerald-400',
  PAYE:    'bg-blue-500/20 text-blue-400',
}
const STATUS_LABEL: Record<string, string> = {
  ATTENTE: 'En attente', VALIDE: 'Validée', PAYE: 'Payée',
}

const TABS = ['Toutes', 'En attente', 'Validées', 'Payées'] as const
type Tab = typeof TABS[number]

export default function CommissionsClient({
  initialCommissions,
}: {
  initialCommissions: Commission[]
}) {
  const [commissions, setCommissions] = useState<Commission[]>(initialCommissions)
  const [contested, setContested]     = useState<Set<string>>(new Set())
  const [tab, setTab]                 = useState<Tab>('Toutes')
  const [loading, setLoading]         = useState<string | null>(null)
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleAction(id: string, action: 'VALIDER' | 'CONTESTER') {
    setLoading(id + action)
    try {
      const res = await fetch(`/api/commissions/${id}/validate`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action }),
      })
      if (!res.ok) {
        const j = await res.json()
        showToast(j.error ?? 'Erreur', false)
        return
      }
      if (action === 'VALIDER') {
        setCommissions(prev =>
          prev.map(c => c.id === id ? { ...c, status: 'VALIDE' } : c)
        )
        showToast('Commission validée', true)
      } else {
        setContested(prev => new Set([...prev, id]))
        showToast('Commission contestée — activité enregistrée', true)
      }
    } finally {
      setLoading(null)
    }
  }

  const filtered = commissions.filter(c => {
    if (tab === 'En attente') return c.status === 'ATTENTE'
    if (tab === 'Validées')   return c.status === 'VALIDE'
    if (tab === 'Payées')     return c.status === 'PAYE'
    return true
  })

  const totalAttente = commissions.filter(c => c.status === 'ATTENTE').reduce((s, c) => s + (c.amount ?? 0), 0)
  const totalValide  = commissions.filter(c => c.status === 'VALIDE').reduce((s, c) => s + (c.amount ?? 0), 0)

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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-white">Commissions</h1>
        <div className="flex gap-4 text-xs">
          <span className="text-amber-400 font-semibold">
            En attente : {totalAttente.toLocaleString('fr-FR')} FCFA
          </span>
          <span className="text-emerald-400 font-semibold">
            Validées : {totalValide.toLocaleString('fr-FR')} FCFA
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t}
            {t === 'En attente' && commissions.filter(c => c.status === 'ATTENTE').length > 0 && (
              <span className="ml-1.5 bg-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded-full text-[10px]">
                {commissions.filter(c => c.status === 'ATTENTE').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-white/30 py-16 text-sm rounded-xl border border-white/10">
          Aucune commission
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                {['Police', 'Agent', 'Client', 'Produit', 'Montant', 'Taux', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr
                  key={c.id}
                  className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                    contested.has(c.id) ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-white/60">{c.policy.policyNumber}</td>
                  <td className="px-4 py-3 text-white font-medium">{c.policy.agent.name}</td>
                  <td className="px-4 py-3 text-white/70">
                    {c.policy.prospect.firstName} {c.policy.prospect.lastName}
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">{c.policy.productType}</td>
                  <td className="px-4 py-3 text-amber-400 font-semibold">
                    {c.amount != null ? c.amount.toLocaleString('fr-FR') + ' FCFA' : '—'}
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {c.rate != null ? `${c.rate}%` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${STATUS_STYLE[c.status] ?? 'bg-white/10 text-white/40'}`}>
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.status === 'ATTENTE' && !contested.has(c.id) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(c.id, 'VALIDER')}
                          disabled={loading === c.id + 'VALIDER'}
                          className="px-3 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => handleAction(c.id, 'CONTESTER')}
                          disabled={loading === c.id + 'CONTESTER'}
                          className="px-3 py-1 bg-amber-600/60 hover:bg-amber-600/80 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                          Contester
                        </button>
                      </div>
                    )}
                    {contested.has(c.id) && (
                      <span className="text-xs text-amber-400/60 italic">Contestée</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
