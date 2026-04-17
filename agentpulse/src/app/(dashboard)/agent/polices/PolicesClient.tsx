'use client'

import { useState } from 'react'

const PRODUCT_TYPES = [
  // Vie & Épargne
  'Assurance Vie Individuelle',
  'Assurance Vie Groupe',
  'Assurance Décès & Invalidité',
  'Épargne & Retraite',
  'Assurance Emprunteur',
  // Auto
  'Assurance Auto Tous Risques',
  'Assurance Auto Tiers Simple',
  'Assurance Auto Tiers Étendu',
  // Habitation & Professionnel
  'Assurance Multirisque Habitation',
  'Assurance Multirisque Professionnelle',
  'Assurance Responsabilité Civile',
  // Santé
  'Assurance Santé Individuelle',
  'Assurance Santé Collective',
  // Autres
  'Assurance Scolaire',
  'Assurance Voyage',
  'Assurance Agriculture / Récoltes',
  'Assurance Transport / Marchandises',
] as const

interface Policy {
  id: string
  policyNumber: string
  productType: string
  premium: number
  startDate: string
  endDate: string
  status: string
  createdAt: string
  prospect: { firstName: string; lastName: string }
}

interface Prospect {
  id: string
  firstName: string
  lastName: string
  stage: string
}

const STATUS_STYLE: Record<string, string> = {
  SOUMISE: 'bg-amber-500/20 text-amber-400',
  EMISE:   'bg-blue-500/20 text-blue-400',
  LIVREE:  'bg-emerald-500/20 text-emerald-400',
}
const STATUS_LABEL: Record<string, string> = {
  SOUMISE: 'En validation', EMISE: 'Émise', LIVREE: 'Livrée',
}

const today = new Date().toISOString().split('T')[0]
const EMPTY  = { prospectId: '', productType: '' as typeof PRODUCT_TYPES[number] | '', premium: '', startDate: today, endDate: '' }

export default function PolicesClient({
  initialPolicies,
  prospects,
}: {
  initialPolicies: Policy[]
  prospects: Prospect[]
}) {
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.productType) return
    setSaving(true)
    try {
      const res = await fetch('/api/policies', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          prospectId:  form.prospectId,
          productType: form.productType,
          premium:     parseFloat(form.premium),
          startDate:   form.startDate,
          endDate:     form.endDate,
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        showToast(j.error ?? 'Erreur', false)
        return
      }
      const created = await res.json()
      setPolicies(prev => [created, ...prev])
      setShowModal(false)
      setForm(EMPTY)
      showToast('Police soumise', true)
    } finally {
      setSaving(false)
    }
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

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Mes Polices</h1>
        <button
          onClick={() => setShowModal(true)}
          disabled={prospects.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle police
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',     value: policies.length,                                  color: 'text-white' },
          { label: 'Émises',   value: policies.filter(p => p.status === 'EMISE').length,  color: 'text-blue-400' },
          { label: 'Livrées',  value: policies.filter(p => p.status === 'LIVREE').length, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {policies.length === 0 ? (
        <div className="text-center text-white/30 py-16 text-sm rounded-xl border border-white/10">
          Aucune police — soumettez votre première police
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                {['N° Police', 'Client', 'Produit', 'Prime', 'Début', 'Fin', 'Statut'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policies.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-white/60">{p.policyNumber}</td>
                  <td className="px-4 py-3 text-white font-medium">
                    {p.prospect.firstName} {p.prospect.lastName}
                  </td>
                  <td className="px-4 py-3 text-white/60 text-xs">{p.productType}</td>
                  <td className="px-4 py-3 text-amber-400 font-semibold">
                    {p.premium.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {new Date(p.startDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {new Date(p.endDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${STATUS_STYLE[p.status] ?? 'bg-white/10 text-white/40'}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nouvelle police */}
      {showModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70"
          onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setForm(EMPTY) } }}
        >
          <div className="bg-[#0D1626] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-5">Nouvelle police</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Client (prospect converti) *</label>
                <select
                  value={form.prospectId}
                  onChange={e => setForm(f => ({ ...f, prospectId: e.target.value }))}
                  required
                  className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ backgroundColor: '#0D1626', color: 'white' }}
                >
                  <option value="" disabled style={{ backgroundColor: '#0D1626', color: '#9ca3af' }}>Sélectionner un prospect</option>
                  {prospects.map(p => (
                    <option key={p.id} value={p.id} style={{ backgroundColor: '#0D1626', color: 'white' }}>
                      {p.firstName} {p.lastName} — {p.stage}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Type de produit *</label>
                <select
                  value={form.productType}
                  onChange={e => setForm(f => ({ ...f, productType: e.target.value as typeof PRODUCT_TYPES[number] }))}
                  required
                  className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ backgroundColor: '#0D1626', color: 'white' }}
                >
                  <option value="" disabled style={{ backgroundColor: '#0D1626', color: '#9ca3af' }}>Sélectionner un produit</option>
                  {PRODUCT_TYPES.map(t => (
                    <option key={t} value={t} style={{ backgroundColor: '#0D1626', color: 'white' }}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Prime annuelle (FCFA) *</label>
                <input
                  type="number" min="0" step="any" required
                  value={form.premium}
                  onChange={e => setForm(f => ({ ...f, premium: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="ex: 250000"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Date de début *</label>
                  <input
                    type="date" required
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Date de fin *</label>
                  <input
                    type="date" required
                    value={form.endDate}
                    min={form.startDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm(EMPTY) }}
                  className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? 'Soumission…' : 'Soumettre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
