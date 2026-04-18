import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Manager — AgentPulse' }

const STAGE_ORDER  = ['CONTACT', 'ENTRETIEN', 'ENTREVUE', 'SOUMISE', 'EMISE', 'LIVRAISON'] as const
const STAGE_LABELS: Record<string, string> = {
  CONTACT: 'Contact', ENTRETIEN: 'Entretien', ENTREVUE: 'Entrevue',
  SOUMISE: 'Soumise', EMISE: 'Émise', LIVRAISON: 'Livraison',
}
const STAGE_COLORS = [
  'bg-gray-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-emerald-500', 'bg-orange-500',
]

function monthDelta(current: number, prev: number): { txt: string; up: boolean } | null {
  if (prev === 0) return null
  const pct = Math.round(((current - prev) / prev) * 100)
  return { txt: `${pct >= 0 ? '+' : ''}${pct}%`, up: pct >= 0 }
}

export default async function ManagerDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const companyId     = session.user.companyId
  const now           = new Date()
  const startMonth    = new Date(now.getFullYear(), now.getMonth(), 1)
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const ago7           = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    contactsMois, policesMois, commissionsData, primesData,
    contactsLastMonth, policiesLastMonth,
    pipelineGroups,
    agentsData,
    pendingPolicies,
    recentActivities,
    inactiveAgents,
    nbSupervisors,
  ] = await Promise.all([
    prisma.prospect.count({ where: { companyId, createdAt: { gte: startMonth } } }),
    prisma.policy.count({ where: { companyId, status: { in: ['EMISE', 'LIVREE'] }, createdAt: { gte: startMonth } } }),
    prisma.commission.findMany({ where: { policy: { companyId }, status: 'VALIDE' }, select: { amount: true } }),
    prisma.policy.findMany({ where: { companyId, status: { in: ['EMISE', 'LIVREE'] } }, select: { premium: true } }),
    prisma.prospect.count({ where: { companyId, createdAt: { gte: startLastMonth, lte: endLastMonth } } }),
    prisma.policy.count({ where: { companyId, status: { in: ['EMISE', 'LIVREE'] }, createdAt: { gte: startLastMonth, lte: endLastMonth } } }),
    prisma.prospect.groupBy({ by: ['stage'], where: { companyId }, _count: { id: true } }),
    prisma.user.findMany({
      where: { companyId, role: 'AGENT', status: { in: ['ACTIVE', 'TRIAL'] } },
      select: {
        id: true, name: true,
        policies:    { where: { createdAt: { gte: startMonth }, status: { in: ['EMISE', 'LIVREE'] } }, select: { id: true } },
        prospects:   { select: { id: true } },
        activities:  { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
      },
    }),
    prisma.policy.count({ where: { companyId, status: 'SOUMISE' } }),
    prisma.activity.findMany({
      where: { user: { companyId } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true, type: true, note: true, createdAt: true,
        user:    { select: { name: true } },
        prospect: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        companyId, role: 'AGENT', status: { in: ['ACTIVE', 'TRIAL'] },
        activities: { none: { createdAt: { gte: ago7 } } },
      },
      select: { id: true, name: true },
      take: 5,
    }),
    prisma.user.count({ where: { companyId, role: 'SUPERVISOR', status: { in: ['ACTIVE', 'TRIAL'] } } }),
  ])

  let company: { objectives: unknown } | null = null
  try {
    company = await prisma.company.findUnique({ where: { id: companyId }, select: { objectives: true } })
  } catch { /* column not yet migrated */ }

  const totalCommissions = commissionsData.reduce((s, c) => s + (c.amount ?? 0), 0)
  const totalPrimes      = primesData.reduce((s, p) => s + (p.premium ?? 0), 0)
  const totalProspects   = await prisma.prospect.count({ where: { companyId } })
  const totalPolices     = await prisma.policy.count({ where: { companyId, status: { in: ['EMISE', 'LIVREE'] } } })
  const tauxMoyen        = totalProspects > 0 ? Math.round((totalPolices / totalProspects) * 100) : 0
  const nbAgents         = agentsData.length

  const topAgents = [...agentsData]
    .sort((a, b) => b.policies.length - a.policies.length)
    .slice(0, 5)
    .map(a => ({
      id:             a.id,
      name:           a.name,
      policesMois:    a.policies.length,
      totalProspects: a.prospects.length,
      taux:           a.prospects.length > 0 ? Math.round((a.policies.length / a.prospects.length) * 100) : 0,
      lastActivity:   a.activities[0]?.createdAt ?? null,
    }))

  const pipelineMap   = Object.fromEntries(pipelineGroups.map(g => [g.stage, g._count.id]))
  const pipelineTotal = Object.values(pipelineMap).reduce((s, v) => s + v, 0)

  const obj = company?.objectives as { contactsMois?: number; policiesMois?: number; primeCible?: number } | null
  const dC  = monthDelta(contactsMois, contactsLastMonth)
  const dP  = monthDelta(policesMois,  policiesLastMonth)

  const alertCount = pendingPolicies + inactiveAgents.length

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Tableau de bord</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' · '}{nbAgents} agent{nbAgents > 1 ? 's' : ''} · {nbSupervisors} superviseur{nbSupervisors > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {alertCount > 0 && (
            <Link href="/manager/alertes"
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-red-500/20 transition-colors">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              {alertCount} alerte{alertCount > 1 ? 's' : ''}
            </Link>
          )}
          {!obj && (
            <Link href="/manager/objectifs"
              className="text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors">
              + Objectifs
            </Link>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Contacts ce mois"   value={contactsMois} fmt={String}
          sub={`${totalProspects} total`} delta={dC}
          target={obj?.contactsMois}
          color="bg-blue-500/10 border-blue-500/20 text-blue-400" bar="bg-blue-500" />
        <KpiCard label="Polices émises"     value={policesMois}  fmt={String}
          sub={`${totalPolices} actives`} delta={dP}
          target={obj?.policiesMois}
          color="bg-violet-500/10 border-violet-500/20 text-violet-400" bar="bg-violet-500" />
        <KpiCard label="Taux conversion"    value={tauxMoyen}    fmt={v => `${v}%`}
          sub={`${nbAgents} agents actifs`}
          color="bg-emerald-500/10 border-emerald-500/20 text-emerald-400" bar="bg-emerald-500" />
        <KpiCard label="Primes (FCFA)"      value={totalPrimes}  fmt={v => v.toLocaleString('fr-FR')}
          sub={`Comm. : ${totalCommissions.toLocaleString('fr-FR')} FCFA`}
          target={obj?.primeCible}
          color="bg-amber-500/10 border-amber-500/20 text-amber-400" bar="bg-amber-500" />
      </div>

      {/* Pipeline */}
      {pipelineTotal > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30">Pipeline prospects</p>
            <span className="text-xs text-gray-500">{pipelineTotal} au total</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {STAGE_ORDER.map((stage, i) => {
              const count = pipelineMap[stage] ?? 0
              const pct   = pipelineTotal > 0 ? Math.round((count / pipelineTotal) * 100) : 0
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-20 shrink-0">{STAGE_LABELS[stage]}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${STAGE_COLORS[i]}`} style={{ width: `${Math.max(pct, count > 0 ? 2 : 0)}%` }} />
                  </div>
                  <span className="text-xs text-white/60 w-8 text-right font-medium">{count}</span>
                  <span className="text-xs text-gray-600 w-8 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top agents + Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top agents */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30">Top agents ce mois</p>
            <Link href="/manager/classement" className="text-xs text-orange-400 hover:text-orange-300">Classement complet →</Link>
          </div>
          {topAgents.length === 0 ? (
            <p className="text-xs text-white/20 py-4 text-center">Aucun agent actif</p>
          ) : (
            <div className="flex flex-col divide-y divide-white/5">
              {topAgents.map((a, i) => {
                const daysInactive = a.lastActivity
                  ? Math.floor((now.getTime() - new Date(a.lastActivity).getTime()) / (1000 * 60 * 60 * 24))
                  : 999
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                return (
                  <div key={a.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-6 text-center shrink-0 text-base">
                      {medal ?? <span className="text-xs text-gray-600 font-bold">{i + 1}</span>}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{a.name}</p>
                      <p className="text-xs text-gray-500">{a.totalProspects} prospect{a.totalProspects > 1 ? 's' : ''} · {a.taux}% taux</p>
                    </div>
                    <div className="text-right shrink-0 mr-2">
                      <p className="text-sm font-bold text-white">{a.policesMois}</p>
                      <p className="text-xs text-gray-600">police{a.policesMois > 1 ? 's' : ''}</p>
                    </div>
                    {daysInactive >= 7 && (
                      <span className="text-xs px-1.5 py-0.5 rounded border text-red-400 bg-red-500/10 border-red-500/20 shrink-0">
                        {daysInactive}j inactif
                      </span>
                    )}
                    {daysInactive >= 3 && daysInactive < 7 && (
                      <span className="text-xs px-1.5 py-0.5 rounded border text-amber-400 bg-amber-500/10 border-amber-500/20 shrink-0">
                        {daysInactive}j
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Alertes */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30">Alertes équipe</p>
            {alertCount > 0 && (
              <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">{alertCount}</span>
            )}
          </div>
          <div className="flex flex-col gap-2.5">
            {alertCount === 0 ? (
              <div className="text-center py-6">
                <p className="text-2xl mb-1">✓</p>
                <p className="text-xs text-gray-500">Tout est en ordre</p>
              </div>
            ) : (
              <>
                {pendingPolicies > 0 && (
                  <Link href="/manager/polices"
                    className="flex items-start gap-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2.5 hover:bg-violet-500/20 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-violet-400">{pendingPolicies} police{pendingPolicies > 1 ? 's' : ''} à valider</p>
                      <p className="text-xs text-gray-500 mt-0.5">En attente de validation</p>
                    </div>
                  </Link>
                )}
                {inactiveAgents.map(a => (
                  <div key={a.id}
                    className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-red-400 truncate">{a.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Inactif depuis 7+ jours</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          {alertCount > 0 && (
            <Link href="/manager/alertes" className="mt-4 block text-xs text-center text-gray-500 hover:text-gray-300">
              Voir toutes les alertes →
            </Link>
          )}
        </div>
      </div>

      {/* Activité récente */}
      {recentActivities.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30">Activité récente</p>
            <Link href="/manager/journal" className="text-xs text-orange-400 hover:text-orange-300">Journal complet →</Link>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {recentActivities.map(a => (
              <div key={a.id} className="flex items-start gap-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/70 line-clamp-1">{a.note}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {a.user.name}
                    {a.prospect ? ` · ${a.prospect.firstName} ${a.prospect.lastName}` : ''}
                  </p>
                </div>
                <span className="text-xs text-gray-600 shrink-0 mt-0.5">
                  {new Date(a.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '+ Nouvel agent',      href: '/manager/utilisateurs', color: 'bg-orange-600 hover:bg-orange-700 text-white' },
          { label: 'Assigner agents',     href: '/manager/assignations', color: 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' },
          { label: 'Voir classement',     href: '/manager/classement',   color: 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' },
          { label: 'Exporter rapport',    href: '/manager/rapports',     color: 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className={`px-4 py-2.5 text-xs font-semibold rounded-xl text-center transition-colors ${a.color}`}>
            {a.label}
          </Link>
        ))}
      </div>

    </div>
  )
}

function KpiCard({ label, value, fmt, sub, delta, target, color, bar }: {
  label: string; value: number; fmt: (v: number) => string; sub: string
  delta?: { txt: string; up: boolean } | null
  target?: number; color: string; bar: string
}) {
  const pct = target && target > 0 ? Math.min(Math.round((value / target) * 100), 100) : 0
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-60 leading-tight">{label}</p>
      <div className="flex items-end gap-2 mt-2">
        <p className="text-3xl font-bold leading-none">{fmt(value)}</p>
        {delta && (
          <span className={`text-xs font-medium mb-0.5 ${delta.up ? 'text-emerald-400' : 'text-red-400'}`}>
            {delta.txt}
          </span>
        )}
      </div>
      <p className="text-xs opacity-50 mt-1.5">{sub}</p>
      {target !== undefined && target > 0 && (
        <>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs opacity-40 w-8 text-right">{pct}%</span>
          </div>
          <p className="text-xs opacity-40 mt-1">Obj. : {target.toLocaleString('fr-FR')}</p>
        </>
      )}
    </div>
  )
}
