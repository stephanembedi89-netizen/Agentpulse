import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Super Admin — AgentPulse' }

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center font-bold">
            ✦
          </div>
          <div>
            <h1 className="text-xl font-bold">Super Administration</h1>
            <p className="text-gray-400 text-sm">Bienvenue, {session.user.name}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard label="Sociétés" value="—" color="bg-orange-600" />
          <StatCard label="Utilisateurs" value="—" color="bg-blue-600" />
          <StatCard label="Polices totales" value="—" color="bg-emerald-600" />
          <StatCard label="Commissions" value="—" color="bg-violet-600" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <div className={`w-2 h-2 rounded-full ${color} mb-3`} />
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}
