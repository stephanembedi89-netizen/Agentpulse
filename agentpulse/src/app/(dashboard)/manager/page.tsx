import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Espace Manager — AgentPulse' }

export default function ManagerDashboard() {
  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Tableau de bord Manager</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Équipe commerciale" value="—" color="bg-violet-500/20 text-violet-400 border-violet-500/20" />
        <StatCard label="Chiffre d'affaires" value="—" color="bg-emerald-500/20 text-emerald-400 border-emerald-500/20" />
        <StatCard label="Commissions validées" value="—" color="bg-amber-500/20 text-amber-400 border-amber-500/20" />
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
