'use client'

import { useState } from 'react'

interface Policy {
  id: string
  policyNumber: string
  productType: string
  premium: number
  createdAt: string
  prospect: { firstName: string; lastName: string }
  agent: { id: string; name: string }
}

export default function ValidationClient({ initialPolicies }: { initialPolicies: Policy[] }) {
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function act(policy: Policy, action: 'VALIDER' | 'RETOURNER') {
    setLoadingId(policy.id)
    try {
      const res = await fetch(`/api/policies/${policy.id}/validate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const j = await res.json()
        showToast(j.error ?? 'Erreur', false)
        return
      }
      setPolicies(prev => prev.filter(p => p.id !== policy.id))
      showToast(
        action === 'VALIDER'
          ? `Police ${policy.policyNumber} validée ✓`
          : `Police ${policy.policyNumber} retournée`,
        action === 'VALIDER'
      )
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 text-sm px-4 py-3 rounded-xl shadow-xl border ${
          toast.ok
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/80 border-red-500/40 text-red-300'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Polices à valider</h1>
        {policies.length > 0 && (
          <span className="text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
            {policies.length} en attente
          </span>
        )}
      </div>

      {policies.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] py-16 text-center">
          <p className="text-emerald-400 font-semibold">File vide</p>
          <p className="text-xs text-white/30 mt-1">Aucune police en attente de validation</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {policies.map(p => (
            <div key={p.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-4">

                {/* Infos police */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">
                      SOUMISE
                    </span>
                    <span className="text-xs text-white/30 font-mono">{p.policyNumber}</span>
                  </div>
                  <p className="font-semibold text-white">
                    {p.prospect.firstName} {p.prospect.lastName}
                  </p>
                  <p className="text-sm text-white/50 mt-0.5">{p.productType}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                    <span>Agent : <span className="text-white/60">{p.agent.name}</span></span>
                    <span>Soumis le : <span className="text-white/60">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</span></span>
                    <span className="text-amber-400 font-semibold">
                      {p.premium.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => act(p, 'VALIDER')}
                    disabled={loadingId === p.id}
                    className="px-4 py-2 text-sm font-semibold bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/20 rounded-xl transition-colors disabled:opacity-40"
                  >
                    {loadingId === p.id ? '…' : 'Valider'}
                  </button>
                  <button
                    onClick={() => act(p, 'RETOURNER')}
                    disabled={loadingId === p.id}
                    className="px-4 py-2 text-sm font-semibold bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 border border-amber-500/20 rounded-xl transition-colors disabled:opacity-40"
                  >
                    {loadingId === p.id ? '…' : 'Retourner'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
