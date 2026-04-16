import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Alertes — AgentPulse' }

export default async function ManagerAlertesPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const companyId = session.user.companyId
  const now       = new Date()
  const ago2days  = new Date(now.getTime() - 2  * 24 * 60 * 60 * 1000)
  const ago7days  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)

  // Alerte 1 : agents avec taux < 20% ET >= 3 prospects
  const agentsLowTaux = await prisma.user.findMany({
    where:  { companyId, role: 'AGENT', status: 'ACTIVE' },
    select: {
      id: true, name: true,
      supervisor: { select: { name: true } },
      prospects: { select: { stage: true } },
      policies:  { where: { status: { in: ['EMISE','LIVREE'] } }, select: { id: true } },
    },
  })

  const alert1 = agentsLowTaux
    .filter(a => a.prospects.length >= 3)
    .filter(a => {
      const taux = a.prospects.length > 0
        ? (a.policies.length / a.prospects.length) * 100 : 0
      return taux < 20
    })
    .map(a => ({
      id:   a.id,
      name: a.name,
      supervisor: a.supervisor?.name ?? '—',
      taux: a.prospects.length > 0
        ? Math.round((a.policies.length / a.prospects.length) * 100) : 0,
      prospects: a.prospects.length,
    }))

  // Alerte 2 : agents inactifs depuis 2 jours (compte > 2 jours)
  const agentsInactive = await prisma.user.findMany({
    where: {
      companyId,
      role:   'AGENT',
      status: 'ACTIVE',
      createdAt: { lte: ago2days },
    },
    select: {
      id: true, name: true,
      supervisor: { select: { name: true } },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true },
      },
    },
  })

  const alert2 = agentsInactive
    .filter(a => {
      const last = a.activities[0]?.createdAt
      return !last || last < ago2days
    })
    .map(a => ({
      id:   a.id,
      name: a.name,
      supervisor: a.supervisor?.name ?? '—',
      lastActivity: a.activities[0]?.createdAt?.toLocaleDateString('fr-FR') ?? 'Jamais',
    }))

  // Alerte 3 : polices EMISE depuis 7+ jours (non livrées)
  const policiesStuck = await prisma.policy.findMany({
    where: {
      companyId,
      status:    'EMISE',
      updatedAt: { lte: ago7days },
    },
    include: {
      prospect: { select: { firstName: true, lastName: true } },
      agent:    { select: { name: true } },
    },
    orderBy: { updatedAt: 'asc' },
  })

  const alert3 = policiesStuck.map(p => ({
    id:           p.id,
    policyNumber: p.policyNumber,
    client:       `${p.prospect.firstName} ${p.prospect.lastName}`,
    agent:        p.agent.name,
    daysStuck:    Math.floor((now.getTime() - p.updatedAt.getTime()) / (1000 * 60 * 60 * 24)),
  }))

  const totalAlerts = alert1.length + alert2.length + alert3.length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-white">Alertes</h1>
        {totalAlerts > 0 && (
          <span className="bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
            {totalAlerts}
          </span>
        )}
      </div>

      {totalAlerts === 0 ? (
        <div className="text-center text-white/30 py-16 text-sm rounded-xl border border-white/10">
          Aucune alerte — tout va bien !
        </div>
      ) : (
        <div className="flex flex-col gap-4">

          {/* Taux < 20% */}
          {alert1.length > 0 && (
            <AlertSection title={`Taux de transformation < 20%`} count={alert1.length} color="red">
              {alert1.map(a => (
                <AlertRow key={a.id}>
                  <span className="text-white font-medium">{a.name}</span>
                  <span className="text-white/40 text-xs">Superviseur : {a.supervisor}</span>
                  <span className="text-white/40 text-xs">{a.prospects} prospects</span>
                  <span className="ml-auto text-red-400 font-bold text-sm">{a.taux}%</span>
                </AlertRow>
              ))}
            </AlertSection>
          )}

          {/* Inactifs 2j */}
          {alert2.length > 0 && (
            <AlertSection title="Inactifs depuis 2+ jours" count={alert2.length} color="amber">
              {alert2.map(a => (
                <AlertRow key={a.id}>
                  <span className="text-white font-medium">{a.name}</span>
                  <span className="text-white/40 text-xs">Superviseur : {a.supervisor}</span>
                  <span className="ml-auto text-amber-400 text-xs font-semibold">Dernière activité : {a.lastActivity}</span>
                </AlertRow>
              ))}
            </AlertSection>
          )}

          {/* EMISE bloquées */}
          {alert3.length > 0 && (
            <AlertSection title="Polices EMISE bloquées 7+ jours" count={alert3.length} color="violet">
              {alert3.map(p => (
                <AlertRow key={p.id}>
                  <span className="text-white font-medium font-mono text-xs">{p.policyNumber}</span>
                  <span className="text-white/60 text-xs">{p.client}</span>
                  <span className="text-white/40 text-xs">Agent : {p.agent}</span>
                  <span className="ml-auto text-violet-400 text-xs font-semibold">{p.daysStuck}j</span>
                </AlertRow>
              ))}
            </AlertSection>
          )}

        </div>
      )}
    </div>
  )
}

function AlertSection({
  title, count, color, children,
}: {
  title: string; count: number; color: 'red' | 'amber' | 'violet'; children: React.ReactNode
}) {
  const colors = {
    red:    'border-red-500/20 bg-red-500/5',
    amber:  'border-amber-500/20 bg-amber-500/5',
    violet: 'border-violet-500/20 bg-violet-500/5',
  }
  const titleColors = {
    red:    'text-red-400',
    amber:  'text-amber-400',
    violet: 'text-violet-400',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${titleColors[color]}`}>
        {title} ({count})
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function AlertRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2 text-sm">
      {children}
    </div>
  )
}
