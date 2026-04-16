'use client'

import { useState } from 'react'

interface Claim {
  id: string
  claimNumber: string
  description: string
  amount: number | null
  status: string
  declaredAt: string
  policy: {
    policyNumber: string
    productType: string
    prospect: { firstName: string; lastName: string }
    agent: { name: string }
  }
}

interface Policy {
  id: string
  policyNumber: string
  productType: string
  prospect: { firstName: string; lastName: string }
}

const CLAIM_STATUS_STYLE: Record<string, string> = {
  OUVERT:      'bg-red-500/20 text-red-400',
  INSTRUCTION: 'bg-amber-500/20 text-amber-400',
  CLOS:        'bg-gray-500/20 text-gray-400',
}
const CLAIM_STATUS_LABEL: Record<string, string> = {
  OUVERT: 'Ouvert', INSTRUCTION: 'En instruction', CLOS: 'Clos',
}

const EMPTY_FORM = { policyId: '', description: '', amount: '' }

export default function SinistresClient({
  initialClaims, policies,
}: {
  initialClaims: Claim[]
  policies: Policy[]
}) {
  const [claims, setClaims]   = useState<Claim[]>(initialClaims)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState<string | null>(null)

  async function declareSinistre(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyId:    form.policyId,
          description: form.description.trim(),
          amount:      form.amount ? parseFloat(form.amount) : null,
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        setToast(j.error ?? 'Erreur')
        setTimeout(() => setToast(null), 3500)
        return
      }
      const created = await res.json()
      // Enrichir avec les données de la police pour l'affichage
      const policy = policies.find(p => p.id === form.policyId)!
      setClaims(prev => [{
        ...created,
        policy: {
          policyNumber: policy.policyNumber,
          productType:  policy.productType,
          prospect:     policy.prospect,
          agent:        { name: '—' },
        },
      }, ...prev])
      setShowModal(false)
      setForm(EMPTY_FORM)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-red-950/80 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Sinistres</h1>
        <button
          onClick={() => setShowModal(true)}
          disabled={policies.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Déclarer un sinistre
        </button>
      </div>

      {claims.length === 0 ? (
        <div className="text-center text-white/30 py-16 text-sm rounded-xl border border-white/10">
          Aucun sinistre déclaré
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                {['N° Sinistre', 'Police', 'Client', 'Description', 'Montant', 'Statut', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map(c => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-white/60">{c.claimNumber}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/60">{c.policy.policyNumber}</td>
                  <td className="px-4 py-3 text-white font-medium">
                    {c.policy.prospect.firstName} {c.policy.prospect.lastName}
                  </td>
                  <td className="px-4 py-3 text-white/60 max-w-xs truncate">{c.description}</td>
                  <td className="px-4 py-3 text-amber-400 font-semibold">
                    {c.amount != null ? c.amount.toLocaleString('fr-FR') + ' FCFA' : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${CLAIM_STATUS_STYLE[c.status] ?? 'bg-white/10 text-white/40'}`}>
                      {CLAIM_STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {new Date(c.declaredAt).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal déclaration sinistre */}
      {showModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-[#0D1626] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-5">Déclarer un sinistre</h2>
            <form onSubmit={declareSinistre} className="flex flex-col gap-4">

              {/* Sélection police */}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Police *</label>
                <select
                  value={form.policyId}
                  onChange={e => setForm(f => ({ ...f, policyId: e.target.value }))}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Sélectionner une police</option>
                  {policies.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.policyNumber} — {p.prospect.firstName} {p.prospect.lastName} ({p.productType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  required
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Décrivez le sinistre…"
                />
              </div>

              {/* Montant */}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Montant estimé (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optionnel"
                />
              </div>

              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }}
                  className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? 'Enregistrement…' : 'Déclarer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
