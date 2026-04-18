import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Santé système — Super Admin' }

async function dbPing(): Promise<{ ok: boolean; ms: number }> {
  const t = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true, ms: Date.now() - t }
  } catch {
    return { ok: false, ms: Date.now() - t }
  }
}

export default async function SantePage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERADMIN') redirect('/login')

  const now   = new Date()
  const ago7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)
  const ago30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const in7   = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000)

  const [db, counts, recent, expiring, byStatus, byRole, lastActivities] = await Promise.all([
    dbPing(),
    Promise.all([
      prisma.company.count(),
      prisma.user.count({ where: { role: { not: 'SUPERADMIN' } } }),
      prisma.policy.count(),
      prisma.prospect.count(),
      prisma.activity.count(),
    ]),
    Promise.all([
      prisma.company.count({ where: { createdAt: { gte: ago30 } } }),
      prisma.user.count({ where: { createdAt: { gte: ago30 }, role: { not: 'SUPERADMIN' } } }),
      prisma.policy.count({ where: { createdAt: { gte: ago7 } } }),
      prisma.activity.count({ where: { createdAt: { gte: ago7 } } }),
    ]),
    prisma.user.findMany({
      where:  { status: 'TRIAL', trialExpiresAt: { gte: now, lte: in7 } },
      select: { name: true, email: true, trialExpiresAt: true, company: { select: { name: true } } },
      orderBy: { trialExpiresAt: 'asc' },
    }),
    prisma.user.groupBy({ by: ['status'], _count: true }),
    prisma.user.groupBy({ by: ['role'], _count: true, where: { role: { not: 'SUPERADMIN' } } }),
    prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        type: true, note: true, createdAt: true,
        user: { select: { name: true, company: { select: { name: true } } } },
      },
    }),
  ])

  const [totalCompanies, totalUsers, totalPolicies, totalProspects, totalActivities] = counts
  const [newCompanies30, newUsers30, newPolicies7, newActivities7] = recent

  const statusMap = Object.fromEntries(byStatus.map(s => [s.status, s._count]))
  const roleMap   = Object.fromEntries(byRole.map(r => [r.role, r._count]))

  const dbColor = db.ok ? (db.ms < 200 ? 'text-emerald-400' : 'text-amber-400') : 'text-red-400'
  const dbLabel = db.ok ? (db.ms < 200 ? `Opérationnel (${db.ms} ms)` : `Lent (${db.ms} ms)`) : 'Erreur de connexion'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">Santé système</h1>
        <p className="text-sm text-gray-400 mt-1">
          État en temps réel de la plateforme · {now.toLocaleString('fr-FR')}
        </p>
      </div>

      {/* Services */}
      <section>
        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Services</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ServiceCard
            label="Base de données"
            value={dbLabel}
            color={dbColor}
            detail="PostgreSQL via Supabase"
          />
          <ServiceCard
            label="Authentification"
            value="Opérationnel"
            color="text-emerald-400"
            detail="NextAuth JWT"
          />
          <ServiceCard
            label="Cron jobs"
            value="Configurés"
            color="text-emerald-400"
            detail="check-trials · snapshots"
          />
        </div>
      </section>

      {/* Volume global */}
      <section>
        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Volume global</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Sociétés"   value={totalCompanies}  sub={`+${newCompanies30} / 30j`} color="text-orange-400" />
          <StatCard label="Utilisateurs" value={totalUsers}    sub={`+${newUsers30} / 30j`}     color="text-blue-400" />
          <StatCard label="Polices"     value={totalPolicies}   sub={`+${newPolicies7} / 7j`}    color="text-violet-400" />
          <StatCard label="Prospects"   value={totalProspects}  sub="total"                      color="text-emerald-400" />
          <StatCard label="Activités"   value={totalActivities} sub={`+${newActivities7} / 7j`}  color="text-amber-400" />
        </div>
      </section>

      {/* Répartition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Statuts utilisateurs */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Statuts des comptes</p>
          <div className="flex flex-col gap-2">
            {[
              { key: 'ACTIVE',    label: 'Actifs',    color: 'bg-emerald-500' },
              { key: 'TRIAL',     label: 'En essai',  color: 'bg-amber-500'   },
              { key: 'SUSPENDED', label: 'Suspendus', color: 'bg-red-500'     },
              { key: 'EXPIRED',   label: 'Expirés',   color: 'bg-gray-500'    },
            ].map(s => {
              const count = statusMap[s.key] ?? 0
              const pct   = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
              return (
                <div key={s.key}>
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>{s.label}</span>
                    <span className="font-semibold text-white">{count} <span className="text-white/30">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Répartition par rôle */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Répartition par rôle</p>
          <div className="flex flex-col gap-3">
            {[
              { key: 'MANAGER',    label: 'Managers',     color: 'text-violet-400' },
              { key: 'SUPERVISOR', label: 'Superviseurs', color: 'text-blue-400'   },
              { key: 'AGENT',      label: 'Agents',       color: 'text-emerald-400'},
            ].map(r => (
              <div key={r.key} className="flex items-center justify-between">
                <span className="text-sm text-white/60">{r.label}</span>
                <span className={`text-lg font-bold ${r.color}`}>{roleMap[r.key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Essais expirant bientôt */}
      {expiring.length > 0 && (
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400/70 mb-3">
            Essais expirant dans 7 jours ({expiring.length})
          </p>
          <div className="flex flex-col gap-2">
            {expiring.map((u, i) => {
              const days = Math.ceil((new Date(u.trialExpiresAt!).getTime() - now.getTime()) / 86400000)
              return (
                <div key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">{u.name}</p>
                    <p className="text-xs text-white/40">{u.company.name} · {u.email}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${days <= 2 ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                    {days}j restant{days > 1 ? 's' : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Dernières activités */}
      <section>
        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Dernières activités</p>
        <div className="rounded-xl border border-white/10 overflow-hidden">
          {lastActivities.map((a, i) => (
            <div key={i} className="flex items-start gap-4 px-4 py-3 border-b border-white/5 last:border-0">
              <span className="text-xs text-white/30 whitespace-nowrap pt-0.5 w-24 flex-shrink-0">
                {new Date(a.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{a.note ?? a.type}</p>
                <p className="text-xs text-white/30">{a.user?.name} · {a.user?.company?.name}</p>
              </div>
              <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded flex-shrink-0">{a.type}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ServiceCard({ label, value, color, detail }: { label: string; value: string; color: string; detail: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color.replace('text-', 'bg-')}`} />
      <div>
        <p className="text-xs text-white/40">{label}</p>
        <p className={`text-sm font-semibold ${color}`}>{value}</p>
        <p className="text-[10px] text-white/20 mt-0.5">{detail}</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[10px] text-white/30 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value.toLocaleString('fr-FR')}</p>
      <p className="text-xs text-white/30 mt-1">{sub}</p>
    </div>
  )
}
