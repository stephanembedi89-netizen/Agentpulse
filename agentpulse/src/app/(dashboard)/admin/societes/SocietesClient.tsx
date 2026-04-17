'use client'

import { useEffect, useState } from 'react'

type Company = {
  id: string
  name: string
  createdAt: string
  _count: { users: number; policies: number }
  users: { id: string; name: string; email: string; status: string; trialExpiresAt: string | null }[]
}

type FormState = {
  companyName: string
  managerName: string
  managerEmail: string
  managerPhone: string
}

const STATUS_LABELS: Record<string, string> = {
  TRIAL: 'Essai', ACTIVE: 'Actif', SUSPENDED: 'Suspendu', EXPIRED: 'Expiré',
}
const STATUS_COLORS: Record<string, string> = {
  TRIAL: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  ACTIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  SUSPENDED: 'text-red-400 bg-red-500/10 border-red-500/20',
  EXPIRED: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
}

export default function SocietesClient() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [created, setCreated]     = useState<{ password: string; email: string } | null>(null)
  const [form, setForm] = useState<FormState>({
    companyName: '', managerName: '', managerEmail: '', managerPhone: '',
  })

  async function load() {
    setLoading(true)
    const r = await fetch('/api/admin/companies')
    const d = await r.json()
    setCompanies(d)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const r = await fetch('/api/admin/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await r.json()
    setSaving(false)
    if (r.ok) {
      setCreated({ password: d.temporaryPassword, email: form.managerEmail })
      setForm({ companyName: '', managerName: '', managerEmail: '', managerPhone: '' })
      setShowForm(false)
      load()
    } else {
      alert(d.error ?? 'Erreur lors de la création')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Sociétés clientes</h1>
          <p className="text-sm text-gray-400 mt-1">{companies.length} société{companies.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setCreated(null) }}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Nouvelle société
        </button>
      </div>

      {/* Message de succès avec mot de passe temporaire */}
      {created && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-1">
          <p className="text-emerald-400 font-semibold text-sm">Société créée avec succès !</p>
          <p className="text-gray-300 text-sm">Email manager : <span className="font-mono text-white">{created.email}</span></p>
          <p className="text-gray-300 text-sm">Mot de passe temporaire : <span className="font-mono text-amber-300 text-base font-bold">{created.password}</span></p>
          <p className="text-gray-500 text-xs">Transmets ces identifiants au manager. Il pourra changer son mot de passe depuis son profil.</p>
        </div>
      )}

      {/* Formulaire création */}
      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Nouvelle société + compte manager</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Nom de la société *</label>
              <input
                required value={form.companyName}
                onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                placeholder="ex: NSIA Cameroun"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Nom du manager *</label>
              <input
                required value={form.managerName}
                onChange={e => setForm(f => ({ ...f, managerName: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                placeholder="ex: Jean-Pierre Mbarga"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email du manager *</label>
              <input
                required type="email" value={form.managerEmail}
                onChange={e => setForm(f => ({ ...f, managerEmail: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                placeholder="manager@societe.cm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Téléphone (optionnel)</label>
              <input
                value={form.managerPhone}
                onChange={e => setForm(f => ({ ...f, managerPhone: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                placeholder="+237 6XX XXX XXX"
              />
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button
                type="submit" disabled={saving}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {saving ? 'Création...' : 'Créer la société'}
              </button>
              <button
                type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des sociétés */}
      {loading ? (
        <p className="text-gray-500 text-sm">Chargement...</p>
      ) : companies.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">Aucune société</p>
          <p className="text-sm mt-1">Crée la première via le bouton ci-dessus</p>
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map(c => {
            const manager = c.users[0]
            return (
              <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{c.name}</p>
                  {manager && (
                    <p className="text-sm text-gray-400 mt-0.5">
                      Manager : {manager.name} · {manager.email}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Créée le {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-white font-semibold">{c._count.users}</p>
                    <p className="text-gray-500 text-xs">utilisateurs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">{c._count.policies}</p>
                    <p className="text-gray-500 text-xs">polices</p>
                  </div>
                  {manager && (
                    <span className={`text-xs px-2 py-1 rounded-md border ${STATUS_COLORS[manager.status] ?? ''}`}>
                      {STATUS_LABELS[manager.status] ?? manager.status}
                    </span>
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
