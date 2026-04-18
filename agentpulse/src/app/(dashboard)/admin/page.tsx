import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Super Admin — AgentPulse' }

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERADMIN') redirect('/login')

  const now    = new Date()
  const ago30  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ago7   = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)
  const in7    = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000)

  const [
    totalCompanies, totalUsers, totalPolicies, commAgg,
    newCompanies30, newUsers30, newPolicies7,
    trialCount, activeCount, suspendedCount, expiredCount,
    expiringAlerts, recentCompanies,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.user.count({ where: { role: { not: 'SUPERADMIN' } } }),
    prisma.policy.count(),
    prisma.commission.aggregate({ _sum: { amount: true } }),
    prisma.company.count({ where: { createdAt: { gte: ago30 } } }),
    prisma.user.count({ where: { createdAt: { gte: ago30 }, role: { not: 'SUPERADMIN' } } }),
    prisma.policy.count({ where: { createdAt: { gte: ago7 } } }),
    prisma.user.count({ where: { role: 'MANAGER', status: 'TRIAL' } }),
    prisma.user.count({ where: { role: 'MANAGER', status: 'ACTIVE' } }),
    prisma.user.count({ where: { role: 'MANAGER', status: 'SUSPENDED' } }),
    prisma.user.count({ where: { role: 'MANAGER', status: 'EXPIRED' } }),
    prisma.user.count({ where: { role: 'MANAGER', status: 'TRIAL', trialExpiresAt: { gte: now, lte: in7 } } }),
    prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, name: true, createdAt: true,
        _count: { select: { users: true, policies: true } },
        users: { where: { role: 'MANAGER' }, select: { status: true }, take: 1 },
      },
    }),
  ])

  const totalCommissions = commAgg._sum.amount ?? 0

  const STATUS_COLOR: Record<string, string> = {
    TRIAL: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    ACTIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    SUSPENDED: 'text-red-400 bg-red-500/10 border-red-500/20',
    EXPIRED: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  }
  const STATUS_LABEL: Record<string, string> = {
    TRIAL: 'Essai', ACTIVE: 'Actif', SUSPENDED: 'Suspendu', EXPIRED: 'Expiré',
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Vue globale</h1>
          <p className="text-sm text-gray-400 mt-1">Tableau de bord Super Admin · {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        {expiringAlerts > 0 && (
          <Link href="/admin/alertes" className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-red-500/20 transition-colors">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            {expiringAlerts} essai{expiringAlerts > 1 ? 's' : ''} expire{expiringAlerts > 1 ? 'nt' : ''} bientôt
          </Link>
        )}
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Sociétés clientes"  value={totalCompanies}                             sub={`+${newCompanies30} ce mois`} color="bg-orange-500/10 text-orange-400 border-orange-500/20" />
        <KpiCard label="Utilisateurs"       value={totalUsers}                                 sub={`+${newUsers30} ce mois`}    color="bg-blue-500/10 text-blue-400 border-blue-500/20" />
        <KpiCard label="Polices totales"    value={totalPolicies}                              sub={`+${newPolicies7} cette semaine`} color="bg-violet-500/10 text-violet-400 border-violet-500/20" />
        <KpiCard label="Commissions (FCFA)" value={totalCommissions.toLocaleString('fr-FR')}  sub="toutes validées"             color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" />
      </div>

      {/* Statuts abonnements */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Statuts des abonnements</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Actifs',    count: activeCount,    color: 'text-emerald-400', href: '/admin/abonnements' },
            { label: 'Essai',     count: trialCount,     color: 'text-amber-400',   href: '/admin/abonnements' },
            { label: 'Suspendus', count: suspendedCount, color: 'text-red-400',     href: '/admin/abonnements' },
            { label: 'Expirés',   count: expiredCount,   color: 'text-gray-400',    href: '/admin/abonnements' },
          ].map(s => (
            <Link key={s.label} href={s.href} className="text-center rounded-lg bg-white/[0.02] border border-white/5 p-4 hover:border-white/10 transition-colors">
              <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-white/30 mt-1 uppercase tracking-wide">{s.label}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sociétés récentes */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30">Dernières sociétés</p>
            <Link href="/admin/societes" className="text-xs text-orange-400 hover:text-orange-300">Voir tout →</Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentCompanies.length === 0 && <p className="text-xs text-white/20 py-4 text-center">Aucune société</p>}
            {recentCompanies.map(c => {
              const status = c.users[0]?.status ?? 'TRIAL'
              return (
                <div key={c.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{c.name}</p>
                    <p className="text-xs text-white/30">{c._count.users} utilisateurs · {c._count.policies} polices</p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-md border flex-shrink-0 ${STATUS_COLOR[status] ?? ''}`}>
                    {STATUS_LABEL[status] ?? status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Actions rapides</p>
          <div className="flex flex-col gap-2">
            {[
              { label: '+ Nouvelle société',      href: '/admin/societes',     color: 'bg-orange-600 hover:bg-orange-700 text-white' },
              { label: 'Gérer les abonnements',   href: '/admin/abonnements',  color: 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' },
              { label: 'Tous les utilisateurs',   href: '/admin/utilisateurs', color: 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' },
              { label: 'Santé système',           href: '/admin/sante',        color: 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' },
              { label: 'Journal d\'activité',     href: '/admin/journal',      color: 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10' },
            ].map(a => (
              <Link key={a.href} href={a.href} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${a.color}`}>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <p className="text-xs opacity-70 leading-tight">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs opacity-50 mt-1">{sub}</p>
    </div>
  )
}
