'use client'

import { useState, useMemo } from 'react'

interface Commission {
  id: string
  amount: number
  rate: number
  month: string
  status: string
  createdAt: string
  policy: {
    policyNumber: string
    productType: string
    premium: number
    prospect: { firstName: string; lastName: string }
  }
}

const STATUS_STYLE: Record<string, string> = {
  ATTENTE: 'bg-amber-500/20 text-amber-400',
  VALIDE:  'bg-emerald-500/20 text-emerald-400',
  PAYE:    'bg-blue-500/20 text-blue-400',
}
const STATUS_LABEL: Record<string, string> = {
  ATTENTE: 'En attente', VALIDE: 'Validée', PAYE: 'Payée',
}

function monthLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export default function CommissionsClient({
  initialCommissions,
  commissionRate,
}: {
  initialCommissions: Commission[]
  commissionRate: number
}) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all')

  // Build list of distinct months
  const months = useMemo(() => {
    const seen = new Set<string>()
    const list: { value: string; label: string }[] = []
    for (const c of initialCommissions) {
      const key = c.month.slice(0, 7) // YYYY-MM
      if (!seen.has(key)) {
        seen.add(key)
        list.push({ value: key, label: monthLabel(c.month) })
      }
    }
    return list
  }, [initialCommissions])

  const filtered = useMemo(() => {
    if (selectedMonth === 'all') return initialCommissions
    return initialCommissions.filter(c => c.month.startsWith(selectedMonth))
  }, [initialCommissions, selectedMonth])

  // Monthly bulletin for selected month
  const bulletin = useMemo(() => {
    const src = selectedMonth === 'all' ? initialCommissions : filtered
    const totalBrut   = src.reduce((s, c) => s + c.amount, 0)
    const totalValide = src.filter(c => c.status !== 'ATTENTE').reduce((s, c) => s + c.amount, 0)
    const totalPaye   = src.filter(c => c.status === 'PAYE').reduce((s, c) => s + c.amount, 0)
    return { totalBrut, totalValide, totalPaye, count: src.length }
  }, [filtered, initialCommissions, selectedMonth])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-white">Mes Commissions</h1>
        <span className="text-xs text-white/30 bg-white/5 px-3 py-1.5 rounded-lg">
          Taux : <span className="text-emerald-400 font-bold">{commissionRate}%</span>
        </span>
      </div>

      {/* Bulletin */}
      <div className="grid grid-cols-3 gap-3">
        <BulletinCard label="Total brut" value={bulletin.totalBrut} color="text-white" />
        <BulletinCard label="Validé" value={bulletin.totalValide} color="text-emerald-400" />
        <BulletinCard label="Payé" value={bulletin.totalPaye} color="text-blue-400" />
      </div>

      {/* Filtre mois */}
      {months.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-white/30">Mois :</span>
          <button
            onClick={() => setSelectedMonth('all')}
            className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${
              selectedMonth === 'all' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            Tous
          </button>
          {months.map(m => (
            <button
              key={m.value}
              onClick={() => setSelectedMonth(m.value)}
              className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${
                selectedMonth === m.value ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center text-white/30 py-16 text-sm rounded-xl border border-white/10">
          Aucune commission pour cette période
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                {['Mois', 'Police', 'Client', 'Produit', 'Prime', 'Taux', 'Commission', 'Statut'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white/40 text-xs capitalize">
                    {monthLabel(c.month)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white/60">{c.policy.policyNumber}</td>
                  <td className="px-4 py-3 text-white font-medium">
                    {c.policy.prospect.firstName} {c.policy.prospect.lastName}
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">{c.policy.productType}</td>
                  <td className="px-4 py-3 text-white/60 text-xs">
                    {c.policy.premium.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">{c.rate}%</td>
                  <td className="px-4 py-3 text-amber-400 font-semibold">
                    {c.amount.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${STATUS_STYLE[c.status] ?? 'bg-white/10 text-white/40'}`}>
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Détail de calcul */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-white/30 mb-3">Détail de calcul</p>
        <p className="text-xs text-white/50">
          Commission = Prime × Taux ({commissionRate}%) ·{' '}
          <span className="text-white/30">Calculée automatiquement à la validation de la police</span>
        </p>
        <p className="text-xs text-white/30 mt-1">
          ATTENTE → validée par le manager → VALIDE → paiement → PAYE
        </p>
      </div>
    </div>
  )
}

function BulletinCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] text-white/30 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value.toLocaleString('fr-FR')} FCFA</p>
    </div>
  )
}
