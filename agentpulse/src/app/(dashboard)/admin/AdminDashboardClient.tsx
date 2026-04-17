'use client'

import { useEffect, useState } from 'react'

type Stats = { companies: number; users: number; policies: number; commissions: number }

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats)
  }, [])

  const cards = [
    { label: 'Sociétés clientes', value: stats?.companies ?? '—', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    { label: 'Utilisateurs totaux', value: stats?.users ?? '—', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { label: 'Polices totales', value: stats?.policies ?? '—', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { label: 'Commissions (FCFA)', value: stats ? stats.commissions.toLocaleString('fr-FR') : '—', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Vue globale</h1>
        <p className="text-sm text-gray-400 mt-1">Tableau de bord Super Admin — Jengu.AI</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`rounded-xl border p-5 ${c.color}`}>
            <p className="text-xs opacity-70">{c.label}</p>
            <p className="text-3xl font-bold mt-2">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-2">Actions rapides</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/societes" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors">
            + Nouvelle société
          </a>
          <a href="/admin/utilisateurs" className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg transition-colors">
            Voir tous les utilisateurs
          </a>
          <a href="/admin/journal" className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg transition-colors">
            Journal système
          </a>
        </div>
      </div>
    </div>
  )
}
