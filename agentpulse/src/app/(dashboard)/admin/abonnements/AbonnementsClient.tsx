'use client'

import { useState } from 'react'

type Manager = { id: string; name: string; email: string; status: string; trialExpiresAt: string | null }
type Company = {
  id: string; name: string; createdAt: string
  _count: { users: number; policies: number }
  users: Manager[]
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

function daysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function AbonnementsClient({ initialCompanies }: { initialCompanies: Company[] }) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies)
  const [acting, setActing]       = useState<string | null>(null)
  const [extendId, setExtendId]   = useState<string | null>(null)
  const [extendDays, setExtendDays] = useState(7)
  const [filter, setFilter]       = useState('ALL')

  async function load() {
    try {
      const r = await fetch('/api/admin/companies')
      if (r.ok) setCompanies(await r.json())
    } catch { /* ignore */ }
  }

  async function act(companyId: string, action: string, extra?: object) {
    setActing(companyId + action)
    await fetch(`/api/admin/companies/${companyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    setActing(null)
    setExtendId(null)
    load()
  }

  const filtered = companies.filter(c => {
    const status = c.users[0]?.status ?? 'TRIAL'
    return filter === 'ALL' || status === filter
  })

  const counts = {
    ALL:       companies.length,
    TRIAL:     companies.filter(c => c.users[0]?.status === 'TRIAL').length,
    ACTIVE:    companies.filter(c => c.users[0]?.status === 'ACTIVE').length,
    SUSPENDED: companies.filter(c => c.users[0]?.status === 'SUSPENDED').length,
    EXPIRED:   companies.filter(c => c.users[0]?.status === 'EXPIRED').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Abonnements</h1>
        <p className="text-sm text-gray-400 mt-1">Gérez les accès et statuts de vos clients</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'TRIAL', 'ACTIVE', 'SUSPENDED', 'EXPIRED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === s
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
            }`}
          >
            {s === 'ALL' ? 'Tous' : STATUS_LABELS[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">Aucune société</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const manager = c.users[0]
            const status  = manager?.status ?? 'TRIAL'
            const days    = daysLeft(manager?.trialExpiresAt ?? null)
            const isActing = acting?.startsWith(c.id)

            return (
              <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{c.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-md border ${STATUS_COLORS[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                      {status === 'TRIAL' && days !== null && (
                        <span className={`text-xs font-medium ${days <= 3 ? 'text-red-400' : 'text-amber-400'}`}>
                          {days > 0 ? `${days}j restant${days > 1 ? 's' : ''}` : 'Expiré aujourd\'hui'}
                        </span>
                      )}
                    </div>
                    {manager && (
                      <p className="text-sm text-gray-400 mt-1">{manager.name} · {manager.email}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">
                      {c._count.users} utilisateurs · {c._count.policies} polices · Depuis le {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {(status === 'TRIAL' || status === 'EXPIRED') && (
                      <button
                        disabled={!!isActing}
                        onClick={() => act(c.id, 'activate')}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {acting === c.id + 'activate' ? '...' : 'Activer'}
                      </button>
                    )}
                    {status === 'SUSPENDED' && (
                      <button
                        disabled={!!isActing}
                        onClick={() => act(c.id, 'reactivate')}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        Réactiver
                      </button>
                    )}
                    {status === 'TRIAL' && (
                      <button
                        onClick={() => setExtendId(extendId === c.id ? null : c.id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/20 rounded-lg transition-colors"
                      >
                        Prolonger
                      </button>
                    )}
                    {(status === 'ACTIVE' || status === 'TRIAL') && (
                      <button
                        disabled={!!isActing}
                        onClick={() => { if (confirm(`Suspendre ${c.name} ?`)) act(c.id, 'suspend') }}
                        className="px-3 py-1.5 text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Suspendre
                      </button>
                    )}
                  </div>
                </div>

                {/* Prolongation inline */}
                {extendId === c.id && (
                  <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                    <span className="text-sm text-gray-400">Prolonger de</span>
                    <select
                      value={extendDays}
                      onChange={e => setExtendDays(Number(e.target.value))}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white"
                    >
                      {[3, 7, 14, 30, 60, 90].map(d => (
                        <option key={d} value={d}>{d} jours</option>
                      ))}
                    </select>
                    <button
                      disabled={!!isActing}
                      onClick={() => act(c.id, 'extend_trial', { extraDays: extendDays })}
                      className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isActing ? '...' : 'Confirmer'}
                    </button>
                    <button onClick={() => setExtendId(null)} className="text-xs text-gray-500 hover:text-gray-300">
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
