import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Détail Agent — AgentPulse' }

const STAGES     = ['CONTACT', 'ENTRETIEN', 'ENTREVUE', 'SOUMISE', 'EMISE', 'LIVRAISON'] as const
const STAGE_LABELS: Record<string, string> = {
  CONTACT: 'Contact', ENTRETIEN: 'Entretien', ENTREVUE: 'Entrevue',
  SOUMISE: 'Soumise', EMISE: 'Émise', LIVRAISON: 'Livraison',
}

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const supervisorId = session.user.id
  const agentId      = params.id

  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    select: { id: true, name: true, email: true, phone: true, commissionRate: true, status: true, createdAt: true, supervisorId: true },
  })

  if (!agent || agent.supervisorId !== supervisorId) notFound()

  const now          = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const since48h     = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  const [prospects, policies, commissions, activities] = await Promise.all([
    prisma.prospect.findMany({
      where: { agentId },
      select: { stage: true, estimatedPrime: true, firstName: true, lastName: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.policy.findMany({
      where: { agentId },
      select: { status: true, premium: true, policyNumber: true, productType: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.commission.findMany({ where: { agentId }, select: { amount: true, status: true } }),
    prisma.activity.findMany({
      where: { userId: agentId },
      select: { type: true, note: true, createdAt: true, prospect: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
  ])

  const pipeline     = Object.fromEntries(STAGES.map(s => [s, prospects.filter(p => p.stage === s).length]))
  const total        = prospects.length
  const tauxGlobal   = total > 0 ? Math.round((pipeline['LIVRAISON'] / total) * 100) : 0
  const policiesMois = policies.filter(p => p.createdAt >= startOfMonth).length
  const isActive     = activities.some(a => new Date(a.createdAt) >= since48h)
  const totalComm    = commissions.reduce((s, c) => s + c.amount, 0)
  const maxPipeline  = Math.max(...Object.values(pipeline), 1)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/supervisor/agents" className="text-gray-400 hover:text-white transition-colors">Mon équipe</Link>
        <span className="text-gray-600">/</span>
        <span className="text-white">{agent.name}</span>
      </div>

      {/* Header agent */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shrink-0">
          {agent.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-white">{agent.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-md border ${
              isActive
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            }`}>
              {isActive ? 'Actif' : 'Inactif 48h+'}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{agent.email} {agent.phone ? `· ${agent.phone}` : ''}</p>
          <p className="text-xs text-gray-600 mt-0.5">Taux commission : {agent.commissionRate}% · Depuis le {new Date(agent.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Prospects total',    value: total,           sub: 'dans le pipeline', color: 'text-blue-400' },
          { label: 'Polices ce mois',    value: policiesMois,    sub: 'émises/livrées',   color: 'text-emerald-400' },
          { label: 'Taux conversion',    value: `${tauxGlobal}%`, sub: 'global',          color: tauxGlobal >= 20 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Commissions',        value: `${Math.round(totalComm / 1000)}k`, sub: 'FCFA total', color: 'text-violet-400' },
        ].map(k => (
          <div key={k.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-400">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Pipeline actuel</h2>
          <div className="space-y-3">
            {STAGES.map(s => (
              <div key={s} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">{STAGE_LABELS[s]}</span>
                <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden relative">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.round((pipeline[s] / maxPipeline) * 100)}%`, backgroundColor: 'var(--brand-primary)', opacity: 0.6 }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                    {pipeline[s]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dernières polices */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Dernières polices</h2>
          {policies.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucune police</p>
          ) : (
            <div className="space-y-2">
              {policies.map(p => (
                <div key={p.policyNumber} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm text-white font-medium">{p.policyNumber}</p>
                    <p className="text-xs text-gray-500">{p.productType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{p.premium.toLocaleString('fr-FR')} FCFA</p>
                    <span className={`text-xs ${p.status === 'LIVREE' ? 'text-emerald-400' : p.status === 'EMISE' ? 'text-blue-400' : 'text-amber-400'}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activités récentes */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Activités récentes</h2>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucune activité</p>
        ) : (
          <div className="space-y-2">
            {activities.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="text-xs text-gray-500 whitespace-nowrap pt-0.5 w-32 shrink-0">
                  {new Date(a.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{a.note ?? a.type}</p>
                  {a.prospect && (
                    <p className="text-xs text-gray-500">{a.prospect.firstName} {a.prospect.lastName}</p>
                  )}
                </div>
                <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded shrink-0">{a.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
