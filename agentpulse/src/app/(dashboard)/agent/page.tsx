import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Espace Agent — AgentPulse' }

export default function AgentDashboard() {
  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Mes prospects" value="—" color="bg-blue-500/20 text-blue-400 border-blue-500/20" />
        <StatCard label="Polices actives" value="—" color="bg-emerald-500/20 text-emerald-400 border-emerald-500/20" />
        <StatCard label="Commissions du mois" value="—" color="bg-amber-500/20 text-amber-400 border-amber-500/20" />
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <p className="text-sm opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}
