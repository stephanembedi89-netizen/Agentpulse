import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tableau de bord — AgentPulse' }

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Clients actifs" value="—" />
        <StatCard label="Polices en cours" value="—" />
        <StatCard label="Renouvellements ce mois" value="—" />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-brand-600 mt-1">{value}</p>
    </div>
  )
}
