import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Manager — AgentPulse' }

export default async function ManagerDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const companyId = session.user.companyId

  const now        = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [contactsMois, policesMois, commissions, primes] = await Promise.all([
    // Contacts ce mois (prospects créés)
    prisma.prospect.count({
      where: { companyId, createdAt: { gte: startMonth } },
    }),
    // Polices émises ce mois
    prisma.policy.count({
      where: {
        companyId,
        status:    { in: ['EMISE', 'LIVREE'] },
        createdAt: { gte: startMonth },
      },
    }),
    // Commissions validées total
    prisma.commission.findMany({
      where: { policy: { companyId }, status: 'VALIDE' },
      select: { amount: true },
    }),
    // Primes totales toutes polices actives
    prisma.policy.findMany({
      where: { companyId, status: { in: ['EMISE', 'LIVREE'] } },
      select: { premium: true },
    }),
  ])

  const totalCommissions = commissions.reduce((s, c) => s + (c.amount ?? 0), 0)
  const totalPrimes       = primes.reduce((s, p) => s + (p.premium ?? 0), 0)

  // Taux moyen de transformation
  const totalProspects = await prisma.prospect.count({ where: { companyId } })
  const totalPolices   = await prisma.policy.count({
    where: { companyId, status: { in: ['EMISE', 'LIVREE'] } },
  })
  const tauxMoyen = totalProspects > 0
    ? Math.round((totalPolices / totalProspects) * 100)
    : 0

  // Effectifs
  const nbAgents      = await prisma.user.count({ where: { companyId, role: 'AGENT',      status: 'ACTIVE' } })
  const nbSupervisors = await prisma.user.count({ where: { companyId, role: 'SUPERVISOR', status: 'ACTIVE' } })

  const kpis = [
    {
      label: 'Contacts ce mois',
      value: contactsMois.toString(),
      sub:   `${totalProspects} total`,
      color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    },
    {
      label: 'Polices émises ce mois',
      value: policesMois.toString(),
      sub:   `${totalPolices} actives`,
      color: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    },
    {
      label: 'Taux de transformation',
      value: `${tauxMoyen} %`,
      sub:   `${nbAgents} agents · ${nbSupervisors} superviseurs`,
      color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    },
    {
      label: 'Primes totales',
      value: totalPrimes.toLocaleString('fr-FR') + ' FCFA',
      sub:   `Commissions validées : ${totalCommissions.toLocaleString('fr-FR')} FCFA`,
      color: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-white">Tableau de bord Manager</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`rounded-xl border p-5 ${k.color}`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2">{k.label}</p>
            <p className="text-3xl font-bold">{k.value}</p>
            <p className="text-xs opacity-50 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
