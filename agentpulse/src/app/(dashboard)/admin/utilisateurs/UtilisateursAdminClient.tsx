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
  const [users, setUsers]         = useState<User[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => { setUsers(d); setLoading(false) })
  }, [])

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
                <th className="pb-3 font-medium">Créé le</th>
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
                  <td className="py-3 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">Aucun résultat</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
