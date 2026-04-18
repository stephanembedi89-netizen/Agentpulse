'use client'

import { useState } from 'react'

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
  TRIAL:     'text-amber-400 bg-amber-500/10 border-amber-500/20',
  ACTIVE:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  SUSPENDED: 'text-red-400 bg-red-500/10 border-red-500/20',
  EXPIRED:   'text-gray-400 bg-gray-500/10 border-gray-500/20',
}

const EMPTY: FormState = { companyName: '', managerName: '', managerEmail: '', managerPhone: '' }

export default function SocietesClient({ initialCompanies }: { initialCompanies: Company[] }) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [created, setCreated]     = useState<{ password: string; email: string } | null>(null)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)
  const [form, setForm]           = useState<FormState>(EMPTY)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  async function refresh() {
    try {
      const r = await fetch('/api/admin/companies')
      if (r.ok) setCompanies(await r.json())
    } catch { /* ignore refresh errors — user sees stale data */ }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await fetch('/api/admin/companies', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const d = await r.json()
      if (r.ok) {
        setCreated({ password: d.temporaryPassword, email: form.managerEmail })
        setForm(EMPTY)
        setShowForm(false)
        refresh()
      } else {
        showToast(d.error ?? 'Erreur lors de la création', false)
      }
    } catch {
      showToast('Erreur réseau', false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">

      {toast && (
        <div className={`fixed top-4 right-4 z-50 border text-sm px-4 py-3 rounded-xl shadow-xl ${
          toast.ok ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                   : 'bg-red-950/80 border-red-500/40 text-red-300'
        }`}>{toast.msg}</div>
      )}

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

      {created && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-1">
          <p className="text-emerald-400 font-semibold text-sm">Société créée avec succès !</p>
          <p className="text-gray-300 text-sm">Email manager : <span className="font-mono text-white">{created.email}</span></p>
          <p className="text-gray-300 text-sm">Mot de passe temporaire : <span className="font-mono text-amber-300 text-base font-bold">{created.password}</span></p>
          <p className="text-gray-500 text-xs">Transmets ces identifiants au manager. Il pourra changer son mot de passe depuis son profil.</p>
          <button onClick={() => setCreated(null)} className="text-xs text-gray-500 hover:text-gray-300 underline">Fermer</button>
        </div>
      )}

      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Nouvelle société + compte manager</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nom de la société *">
              <input required value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                className="input-base" placeholder="ex: NSIA Cameroun" />
            </Field>
            <Field label="Nom du manager *">
              <input required value={form.managerName} onChange={e => setForm(f => ({ ...f, managerName: e.target.value }))}
                className="input-base" placeholder="ex: Jean-Pierre Mbarga" />
            </Field>
            <Field label="Email du manager *">
              <input required type="email" value={form.managerEmail} onChange={e => setForm(f => ({ ...f, managerEmail: e.target.value }))}
                className="input-base" placeholder="manager@societe.cm" />
            </Field>
            <Field label="Téléphone (optionnel)">
              <input value={form.managerPhone} onChange={e => setForm(f => ({ ...f, managerPhone: e.target.value }))}
                className="input-base" placeholder="+237 6XX XXX XXX" />
            </Field>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                {saving ? 'Création...' : 'Créer la société'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg transition-colors">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {companies.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">Aucune société</p>
          <p className="text-sm mt-1">Créez la première via le bouton ci-dessus</p>
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map(c => {
            const manager = c.users[0]
            return (
              <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{c.name}</p>
                  {manager && <p className="text-sm text-gray-400 mt-0.5">{manager.name} · {manager.email}</p>}
                  <p className="text-xs text-gray-500 mt-1">Créée le {new Date(c.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-4 text-sm flex-shrink-0">
                  <Kpi v={c._count.users}    label="utilisateurs" />
                  <Kpi v={c._count.policies} label="polices" />
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

      <style jsx>{`
        .input-base { width:100%; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:.5rem; padding:.5rem .75rem; font-size:.875rem; color:white; outline:none; }
        .input-base:focus { border-color:rgb(234,88,12); }
      `}</style>
    </div>
  )
}

function Kpi({ v, label }: { v: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-white font-semibold">{v}</p>
      <p className="text-gray-500 text-xs">{label}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      {children}
    </div>
  )
}
