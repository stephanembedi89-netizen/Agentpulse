'use client'

import { useState } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  supervisorId: string | null
  supervisor: { name: string } | null
}

interface Supervisor {
  id: string
  name: string
}

const ROLE_STYLE: Record<string, string> = {
  SUPERADMIN: 'bg-red-500/20 text-red-400',
  MANAGER:    'bg-violet-500/20 text-violet-400',
  SUPERVISOR: 'bg-blue-500/20 text-blue-400',
  AGENT:      'bg-gray-500/20 text-gray-400',
}

const EMPTY_FORM = { name: '', email: '', password: '', role: 'AGENT' as 'AGENT' | 'SUPERVISOR', supervisorId: '' }

export default function UtilisateursClient({
  initialUsers,
  supervisors,
}: {
  initialUsers: User[]
  supervisors: Supervisor[]
}) {
  const [users, setUsers]         = useState<User[]>(initialUsers)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:         form.name.trim(),
          email:        form.email.trim().toLowerCase(),
          password:     form.password,
          role:         form.role,
          supervisorId: form.role === 'AGENT' && form.supervisorId ? form.supervisorId : null,
        }),
      })
      if (!res.ok) {
        const j = await res.json()
        showToast(j.error ?? 'Erreur', false)
        return
      }
      const created = await res.json()
      setUsers(prev => [{ ...created, supervisor: null }, ...prev])
      setShowModal(false)
      setForm(EMPTY_FORM)
      showToast('Utilisateur créé', true)
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(user: User) {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    setLoadingId(user.id)
    const prev = [...users]
    setUsers(u => u.map(x => x.id === user.id ? { ...x, status: newStatus } : x))
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        setUsers(prev)
        const j = await res.json()
        showToast(j.error ?? 'Erreur', false)
      } else {
        showToast(newStatus === 'ACTIVE' ? 'Compte activé' : 'Compte désactivé', true)
      }
    } finally {
      setLoadingId(null)
    }
  }

  async function assignSupervisor(userId: string, supervisorId: string) {
    setLoadingId(userId)
    const prev = [...users]
    const sup  = supervisors.find(s => s.id === supervisorId) ?? null
    setUsers(u => u.map(x => x.id === userId
      ? { ...x, supervisorId: supervisorId || null, supervisor: sup ? { name: sup.name } : null }
      : x
    ))
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ supervisorId: supervisorId || null }),
      })
      if (!res.ok) {
        setUsers(prev)
        const j = await res.json()
        showToast(j.error ?? 'Erreur', false)
      } else {
        showToast('Superviseur assigné', true)
      }
    } finally {
      setLoadingId(null)
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
        <h1 className="text-xl font-bold text-white">Utilisateurs</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter
        </button>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              {['Nom', 'Email', 'Rôle', 'Superviseur', 'Statut', 'Créé le', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${u.status === 'SUSPENDED' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                <td className="px-4 py-3 text-white/50 text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${ROLE_STYLE[u.role] ?? 'bg-white/10 text-white/40'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.role === 'AGENT' ? (
                    <select
                      value={u.supervisorId ?? ''}
                      onChange={e => assignSupervisor(u.id, e.target.value)}
                      disabled={loadingId === u.id}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="">— Aucun —</option>
                      {supervisors.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-white/30 text-xs">{u.supervisor?.name ?? '—'}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                    u.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {u.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/30 text-xs">
                  {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3">
                  {u.role !== 'SUPERADMIN' && (
                    <button
                      onClick={() => toggleStatus(u)}
                      disabled={loadingId === u.id}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${
                        u.status === 'ACTIVE'
                          ? 'bg-red-600/60 hover:bg-red-600/80 text-white'
                          : 'bg-emerald-600/60 hover:bg-emerald-600/80 text-white'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal création */}
      {showModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70"
          onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setForm(EMPTY_FORM) } }}
        >
          <div className="bg-[#0D1626] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-5">Nouvel utilisateur</h2>
            <form onSubmit={createUser} className="flex flex-col gap-4">

              <Field label="Nom *">
                <input
                  type="text" required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-base" placeholder="Jean Dupont"
                />
              </Field>

              <Field label="Email *">
                <input
                  type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-base" placeholder="jean@example.com"
                />
              </Field>

              <Field label="Mot de passe *">
                <input
                  type="password" required minLength={6} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-base" placeholder="Min 6 caractères"
                />
              </Field>

              <Field label="Rôle *">
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as 'AGENT' | 'SUPERVISOR' }))}
                  className="input-base"
                >
                  <option value="AGENT">Agent</option>
                  <option value="SUPERVISOR">Superviseur</option>
                </select>
              </Field>

              {form.role === 'AGENT' && (
                <Field label="Superviseur">
                  <select
                    value={form.supervisorId}
                    onChange={e => setForm(f => ({ ...f, supervisorId: e.target.value }))}
                    className="input-base"
                  >
                    <option value="">— Aucun —</option>
                    {supervisors.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </Field>
              )}

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
                  {saving ? 'Création…' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-base {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
        }
        .input-base:focus {
          ring: 1px solid rgb(59,130,246);
          border-color: rgb(59,130,246);
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
