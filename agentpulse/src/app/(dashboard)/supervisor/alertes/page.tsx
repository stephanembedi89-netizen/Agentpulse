import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Alertes — AgentPulse' }

export default async function SupervisorAlertesPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const agents = await prisma.user.findMany({
    where:   { supervisorId: session.user.id, companyId: session.user.companyId },
    select:  { id: true, name: true, createdAt: true },
  })

  if (agents.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold text-white mb-6">Alertes Coaching</h1>
        <div className="text-center text-white/30 py-16 text-sm rounded-xl border border-white/10">
          Aucun agent dans votre équipe
        </div>
      </div>
    )
  }

  const agentIds    = agents.map(a => a.id)
  const now         = new Date()
  const twoDaysAgo  = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // ── Données prospects ───────────────────────────────────────────────────────
  const allProspects = await prisma.prospect.findMany({
    where:   { agentId: { in: agentIds }, companyId: session.user.companyId },
    select:  { agentId: true, stage: true, updatedAt: true, firstName: true, lastName: true, id: true },
  })

  // ── Activité récente (dernières 48h) ────────────────────────────────────────
  const recentActivities = await prisma.activity.findMany({
    where:  { userId: { in: agentIds }, createdAt: { gte: twoDaysAgo } },
    select: { userId: true },
    distinct: ['userId'],
  })
  const activeUserIds = new Set(recentActivities.map(a => a.userId))

  // ── ALERTE 1 : Taux global < 20% (min 3 prospects) ─────────────────────────
  const lowTauxAlerts = agents
    .map(agent => {
      const prospects  = allProspects.filter(p => p.agentId === agent.id)
      const total      = prospects.length
      const livraisons = prospects.filter(p => p.stage === 'LIVRAISON').length
      const tauxGlobal = total > 0 ? Math.round((livraisons / total) * 100) : 0
      return { ...agent, total, tauxGlobal }
    })
    .filter(a => a.total >= 3 && a.tauxGlobal < 20)

  // ── ALERTE 2 : Aucune saisie depuis 2 jours (compte > 2 jours) ─────────────
  const inactiveAlerts = agents.filter(a =>
    !activeUserIds.has(a.id) && new Date(a.createdAt) < twoDaysAgo
  )

  // ── ALERTE 3 : Prospects bloqués en EMISE depuis 7+ jours ──────────────────
  const blockedProspects = allProspects.filter(
    p => p.stage === 'EMISE' && new Date(p.updatedAt) <= sevenDaysAgo
  )
  const blockedByAgent = agents
    .map(agent => ({
      ...agent,
      blocked: blockedProspects.filter(p => p.agentId === agent.id),
    }))
    .filter(a => a.blocked.length > 0)

  const totalAlerts = lowTauxAlerts.length + inactiveAlerts.length + blockedByAgent.length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Alertes Coaching</h1>
        {totalAlerts > 0 && (
          <span className="text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full">
            {totalAlerts} alerte{totalAlerts > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {totalAlerts === 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
          <p className="text-emerald-400 font-semibold">Tout va bien 🎯</p>
          <p className="text-xs text-white/40 mt-1">Aucune alerte coaching pour votre équipe</p>
        </div>
      )}

      {/* Alerte 1 : taux global bas */}
      {lowTauxAlerts.length > 0 && (
        <AlertSection
          color="red"
          icon="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          title="Taux global < 20 %"
          subtitle="Ces agents ont un taux de conversion en dessous du seuil cible"
        >
          {lowTauxAlerts.map(a => (
            <AlertRow key={a.id}>
              <span className="font-medium text-white">{a.name}</span>
              <span className="text-white/40 text-xs">{a.total} prospects</span>
              <span className="ml-auto text-red-400 font-bold text-sm">{a.tauxGlobal} %</span>
            </AlertRow>
          ))}
        </AlertSection>
      )}

      {/* Alerte 2 : inactivité */}
      {inactiveAlerts.length > 0 && (
        <AlertSection
          color="amber"
          icon="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          title="Aucune saisie depuis 2 jours"
          subtitle="Ces agents n'ont pas enregistré d'activité récente"
        >
          {inactiveAlerts.map(a => (
            <AlertRow key={a.id}>
              <span className="font-medium text-white">{a.name}</span>
              <span className="text-amber-400 text-xs ml-auto">Relancer</span>
            </AlertRow>
          ))}
        </AlertSection>
      )}

      {/* Alerte 3 : livraisons bloquées */}
      {blockedByAgent.length > 0 && (
        <AlertSection
          color="orange"
          icon="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          title="Livraisons bloquées (7+ jours en EMISE)"
          subtitle="Ces prospects sont émis mais n'ont pas encore été livrés"
        >
          {blockedByAgent.map(a =>
            a.blocked.map(p => (
              <AlertRow key={p.id}>
                <span className="font-medium text-white">{p.firstName} {p.lastName}</span>
                <span className="text-white/40 text-xs">— {a.name}</span>
                <span className="ml-auto text-orange-400 text-xs">
                  {Math.floor((now.getTime() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24))}j bloqué
                </span>
              </AlertRow>
            ))
          )}
        </AlertSection>
      )}
    </div>
  )
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

const ALERT_COLORS: Record<string, { border: string; bg: string; icon: string; badge: string }> = {
  red:    { border: 'border-red-500/20',    bg: 'bg-red-500/5',    icon: 'text-red-400',    badge: 'bg-red-500/10 text-red-400' },
  amber:  { border: 'border-amber-500/20',  bg: 'bg-amber-500/5',  icon: 'text-amber-400',  badge: 'bg-amber-500/10 text-amber-400' },
  orange: { border: 'border-orange-500/20', bg: 'bg-orange-500/5', icon: 'text-orange-400', badge: 'bg-orange-500/10 text-orange-400' },
}

function AlertSection({
  color, icon, title, subtitle, children,
}: {
  color: string
  icon: string
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  const c = ALERT_COLORS[color]
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} overflow-hidden`}>
      <div className="px-5 py-4 border-b border-white/5 flex items-start gap-3">
        <svg className={`w-5 h-5 shrink-0 mt-0.5 ${c.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
        </svg>
        <div>
          <p className={`text-sm font-bold ${c.icon}`}>{title}</p>
          <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="divide-y divide-white/5">{children}</div>
    </div>
  )
}

function AlertRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 text-sm">
      {children}
    </div>
  )
}
