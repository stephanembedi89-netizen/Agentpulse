import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Espace Superviseur — AgentPulse' }

export default function SupervisorDashboard() {
  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Tableau de bord Superviseur</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Agents supervisés" value="—" color="bg-emerald-500/20 text-emerald-400 border-emerald-500/20" />
        <StatCard label="Prospects équipe" value="—" color="bg-blue-500/20 text-blue-400 border-blue-500/20" />
        <StatCard label="Performance du mois" value="—" color="bg-violet-500/20 text-violet-400 border-violet-500/20" />
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
