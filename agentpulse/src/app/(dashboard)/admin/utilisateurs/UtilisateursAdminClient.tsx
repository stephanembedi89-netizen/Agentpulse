'use client'

import { useEffect, useState } from 'react'

type User = {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  trialExpiresAt: string | null
  company: { id: string; name: string }
}

type ResetResult = { email: string; temporaryPassword: string }

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin', MANAGER: 'Manager', SUPERVISOR: 'Superviseur', AGENT: 'Agent',
}
const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  MANAGER:    'text-violet-400 bg-violet-500/10 border-violet-500/20',
  SUPERVISOR: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  AGENT:      'text-blue-400 bg-blue-500/10 border-blue-500/20',
}
const STATUS_COLORS: Record<string, string> = {
  TRIAL: 'text-amber-400', ACTIVE: 'text-emerald-400',
  SUSPENDED: 'text-red-400', EXPIRED: 'text-gray-400',
}

export default function UtilisateursAdminClient() {
  const [users, setUsers]           = useState<User[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [resetting, setResetting]   = useState<string | null>(null)
  const [resetResult, setResetResult] = useState<ResetResult | null>(null)

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => { setUsers(d); setLoading(false) })
  }, [])

  async function handleReset(userId: string) {
    if (!confirm('Réinitialiser le mot de passe de cet utilisateur ?')) return
    setResetting(userId)
    setResetResult(null)
    const r = await fetch('/api/admin/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const d = await r.json()
    setResetting(null)
    if (r.ok) setResetResult(d)
    else alert(d.error ?? 'Erreur')
  }

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase()) ||
                        u.company.name.toLowerCase().includes(search.toLowerCase())
    const matchRole   = roleFilter === 'ALL' || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Tous les utilisateurs</h1>
        <p className="text-sm text-gray-400 mt-1">{users.length} utilisateur{users.length > 1 ? 's' : ''} au total</p>
      </div>

      {/* Résultat réinitialisation */}
      {resetResult && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-1">
          <p className="text-emerald-400 font-semibold text-sm">Mot de passe réinitialisé !</p>
          <p className="text-gray-300 text-sm">Email : <span className="font-mono text-white">{resetResult.email}</span></p>
          <p className="text-gray-300 text-sm">Nouveau mot de passe temporaire : <span className="font-mono text-amber-300 text-lg font-bold">{resetResult.temporaryPassword}</span></p>
          <p className="text-gray-500 text-xs">Transmets ce mot de passe à l'utilisateur. Il pourra le changer après connexion.</p>
          <button onClick={() => setResetResult(null)} className="text-xs text-gray-500 hover:text-gray-300 mt-1 underline">Fermer</button>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email, société..."
          className="flex-1 min-w-48 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
        />
        <select
          value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="ALL">Tous les rôles</option>
          <option value="MANAGER">Manager</option>
          <option value="SUPERVISOR">Superviseur</option>
          <option value="AGENT">Agent</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Chargement...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-gray-400 text-xs">
                <th className="pb-3 pr-4 font-medium">Nom</th>
                <th className="pb-3 pr-4 font-medium">Société</th>
                <th className="pb-3 pr-4 font-medium">Rôle</th>
                <th className="pb-3 pr-4 font-medium">Statut</th>
                <th className="pb-3 pr-4 font-medium">Créé le</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 pr-4">
                    <p className="text-white font-medium">{u.name}</p>
                    <p className="text-gray-500 text-xs">{u.email}</p>
                  </td>
                  <td className="py-3 pr-4 text-gray-300">{u.company.name}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2 py-1 rounded-md border ${ROLE_COLORS[u.role] ?? ''}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs font-medium ${STATUS_COLORS[u.status] ?? 'text-gray-400'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3">
                    {u.role !== 'SUPERADMIN' && (
                      <button
                        onClick={() => handleReset(u.id)}
                        disabled={resetting === u.id}
                        className="text-xs px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {resetting === u.id ? '...' : 'Réinit. MDP'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">Aucun résultat</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
