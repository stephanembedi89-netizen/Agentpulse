import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Super Admin — AgentPulse' }

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Super Administration</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Sociétés" value="—" color="bg-orange-500/20 text-orange-400 border-orange-500/20" />
        <StatCard label="Utilisateurs" value="—" color="bg-blue-500/20 text-blue-400 border-blue-500/20" />
        <StatCard label="Polices totales" value="—" color="bg-emerald-500/20 text-emerald-400 border-emerald-500/20" />
        <StatCard label="Commissions" value="—" color="bg-violet-500/20 text-violet-400 border-violet-500/20" />
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
