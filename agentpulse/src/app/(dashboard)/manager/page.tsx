import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Manager — AgentPulse' }

function Progress({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  )
}

export default async function ManagerDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const companyId = session.user.companyId
  const now       = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [contactsMois, policesMois, commissions, primes] = await Promise.all([
    prisma.prospect.count({ where: { companyId, createdAt: { gte: startMonth } } }),
    prisma.policy.count({ where: { companyId, status: { in: ['EMISE', 'LIVREE'] }, createdAt: { gte: startMonth } } }),
    prisma.commission.findMany({ where: { policy: { companyId }, status: 'VALIDE' }, select: { amount: true } }),
    prisma.policy.findMany({ where: { companyId, status: { in: ['EMISE', 'LIVREE'] } }, select: { premium: true } }),
  ])

  // objectives column may not exist on older DB versions — degrade gracefully
  let company: { objectives: unknown } | null = null
  try {
    company = await prisma.company.findUnique({ where: { id: companyId }, select: { objectives: true } })
  } catch { /* column not yet migrated */ }

  const totalCommissions = commissions.reduce((s, c) => s + (c.amount ?? 0), 0)
  const totalPrimes      = primes.reduce((s, p) => s + (p.premium ?? 0), 0)

  const totalProspects = await prisma.prospect.count({ where: { companyId } })
  const totalPolices   = await prisma.policy.count({ where: { companyId, status: { in: ['EMISE', 'LIVREE'] } } })
  const tauxMoyen      = totalProspects > 0 ? Math.round((totalPolices / totalProspects) * 100) : 0

  const nbAgents      = await prisma.user.count({ where: { companyId, role: 'AGENT',      status: { in: ['ACTIVE','TRIAL'] } } })
  const nbSupervisors = await prisma.user.count({ where: { companyId, role: 'SUPERVISOR', status: { in: ['ACTIVE','TRIAL'] } } })

  const obj = company?.objectives as { contactsMois?: number; policiesMois?: number; primeCible?: number; tauxCommission?: number } | null

  const kpis = [
    { label: 'Contacts ce mois',     value: contactsMois,   target: obj?.contactsMois,   fmt: (v: number) => v.toString(),                     sub: `${totalProspects} total`,                color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',   bar: 'bg-blue-500' },
    { label: 'Polices émises ce mois', value: policesMois,  target: obj?.policiesMois,   fmt: (v: number) => v.toString(),                     sub: `${totalPolices} actives`,                color: 'bg-violet-500/10 border-violet-500/20 text-violet-400', bar: 'bg-violet-500' },
    { label: 'Taux transformation',   value: tauxMoyen,     target: undefined,           fmt: (v: number) => `${v}%`,                          sub: `${nbAgents} agents · ${nbSupervisors} superviseurs`, color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', bar: 'bg-emerald-500' },
    { label: 'Primes totales (FCFA)', value: totalPrimes,   target: obj?.primeCible,     fmt: (v: number) => v.toLocaleString('fr-FR'),         sub: `Commissions validées : ${totalCommissions.toLocaleString('fr-FR')} FCFA`, color: 'bg-amber-500/10 border-amber-500/20 text-amber-400', bar: 'bg-amber-500' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Tableau de bord Manager</h1>
        {!obj && (
          <a href="/manager/objectifs" className="text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors">
            + Définir des objectifs
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`rounded-xl border p-5 ${k.color}`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2">{k.label}</p>
            <p className="text-3xl font-bold">{k.fmt(k.value)}</p>
            <p className="text-xs opacity-50 mt-1">{k.sub}</p>
            {k.target !== undefined && k.target > 0 && (
              <>
                <Progress value={k.value} max={k.target} color={k.bar} />
                <p className="text-xs opacity-40 mt-1">Objectif : {k.target.toLocaleString('fr-FR')}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {obj && (
        <p className="text-xs text-gray-600 text-right">
          Objectifs définis — <a href="/manager/objectifs" className="hover:text-gray-400 underline">modifier</a>
        </p>
      )}
    </div>
  )
}
