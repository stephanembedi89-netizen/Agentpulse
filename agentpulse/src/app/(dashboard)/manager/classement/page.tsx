import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Classement — AgentPulse' }

const MEDALS = ['🥇', '🥈', '🥉']

function agentSuggestion(a: {
  policesMois: number; policesTotal: number; taux: number; contactsMois: number
}): { text: string; color: string } | null {
  if (a.policesTotal === 0 && a.contactsMois === 0)
    return { text: 'Pas encore démarré — planifier un entretien individuel cette semaine', color: 'text-red-400' }
  if (a.policesMois === 0)
    return { text: 'Aucune police ce mois — prévoir un coaching de relance prospection', color: 'text-amber-400' }
  if (a.taux < 20)
    return { text: 'Taux de conversion faible — former sur les techniques de closing', color: 'text-amber-400' }
  if (a.taux > 55 && a.policesMois >= 3)
    return { text: 'Excellent profil — proposer un rôle de mentor ou des objectifs élargis', color: 'text-emerald-400' }
  if (a.policesMois >= 1 && a.taux >= 30)
    return { text: 'Bonne dynamique — maintenir le suivi hebdomadaire', color: 'text-blue-400' }
  return null
}

function supervisorSuggestion(s: {
  nbAgents: number
  team: { inactives: number; taux: number; mois: number; polices: number }
}): { text: string; color: string } | null {
  if (s.nbAgents === 0)
    return { text: 'Aucun agent assigné — assigner des agents à ce superviseur', color: 'text-amber-400' }
  if (s.team.mois === 0)
    return { text: "Aucune police ce mois dans l'équipe — réunion d'urgence requise", color: 'text-red-400' }
  if (s.team.inactives > 0)
    return { text: `${s.team.inactives} agent(s) inactif(s) — relancer et accompagner rapidement`, color: 'text-red-400' }
  if (s.team.taux < 25)
    return { text: 'Taux équipe faible — organiser une formation closing collective', color: 'text-amber-400' }
  if (s.team.taux > 50 && s.team.mois >= 3)
    return { text: 'Équipe performante — partager les bonnes pratiques en réunion plénière', color: 'text-emerald-400' }
  return null
}

export default async function ClassementPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const companyId  = session.user.companyId
  const now        = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const ago2days   = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const tab        = searchParams.tab === 'superviseurs' ? 'superviseurs' : 'agents'

  // ── Agents ──────────────────────────────────────────────────────────────────
  const agentsRaw = await prisma.user.findMany({
    where:  { companyId, role: 'AGENT', status: 'ACTIVE' },
    select: {
      id: true, name: true,
      supervisor: { select: { name: true } },
      policies:   { where: { status: { in: ['EMISE', 'LIVREE'] } }, select: { premium: true, createdAt: true } },
      prospects:  { select: { id: true, createdAt: true } },
    },
  })

  const rankedAgents = agentsRaw.map(a => {
    const policesTotal  = a.policies.length
    const policesMois   = a.policies.filter(p => p.createdAt >= startMonth).length
    const primesTotales = a.policies.reduce((s, p) => s + (p.premium ?? 0), 0)
    const taux          = a.prospects.length > 0 ? Math.round((policesTotal / a.prospects.length) * 100) : 0
    const contactsMois  = a.prospects.filter(p => p.createdAt >= startMonth).length
    return { id: a.id, name: a.name, supervisor: a.supervisor?.name ?? '—', policesMois, policesTotal, contactsMois, primesTotales, taux }
  }).sort((a, b) => b.policesTotal - a.policesTotal)

  // ── Superviseurs ─────────────────────────────────────────────────────────────
  const supsRaw = await prisma.user.findMany({
    where:  { companyId, role: 'SUPERVISOR', status: 'ACTIVE' },
    select: {
      id: true, name: true,
      policies:  { where: { status: { in: ['EMISE', 'LIVREE'] } }, select: { premium: true, createdAt: true } },
      prospects: { select: { id: true } },
      agents: {
        where:  { status: 'ACTIVE' },
        select: {
          id: true,
          policies:   { where: { status: { in: ['EMISE', 'LIVREE'] } }, select: { premium: true, createdAt: true } },
          prospects:  { select: { id: true } },
          activities: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
        },
      },
    },
  })

  const rankedSupervisors = supsRaw.map(s => {
    const teamPolices = s.agents.reduce((sum, a) => sum + a.policies.length, 0)
    const teamMois    = s.agents.reduce((sum, a) => sum + a.policies.filter(p => p.createdAt >= startMonth).length, 0)
    const teamProsp   = s.agents.reduce((sum, a) => sum + a.prospects.length, 0)
    const teamTaux    = teamProsp > 0 ? Math.round((teamPolices / teamProsp) * 100) : 0
    const teamPrimes  = s.agents.reduce((sum, a) => sum + a.policies.reduce((s2, p) => s2 + (p.premium ?? 0), 0), 0)
    const inactives   = s.agents.filter(a => { const l = a.activities[0]?.createdAt; return !l || l < ago2days }).length
    return {
      id: s.id, name: s.name, nbAgents: s.agents.length,
      perso: { polices: s.policies.length, mois: s.policies.filter(p => p.createdAt >= startMonth).length },
      team:  { polices: teamPolices, mois: teamMois, taux: teamTaux, primes: teamPrimes, inactives },
    }
  }).sort((a, b) => b.team.polices - a.team.polices)

  const maxA = Math.max(...rankedAgents.map(a => a.policesTotal), 1)
  const maxS = Math.max(...rankedSupervisors.map(s => s.team.polices), 1)

  return (
    <div className="flex flex-col gap-5">

      {/* Header + tabs */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Classement</h1>
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          <TabLink href="/manager/classement?tab=agents"       active={tab === 'agents'}       label="Agents" />
          <TabLink href="/manager/classement?tab=superviseurs" active={tab === 'superviseurs'} label="Superviseurs" />
        </div>
      </div>

      {/* ── Tab Agents ── */}
      {tab === 'agents' && (
        rankedAgents.length === 0 ? <Empty label="Aucun agent actif" /> : (
          <div className="flex flex-col gap-3">
            {rankedAgents.map((a, i) => {
              const suggestion = agentSuggestion(a)
              return (
                <div key={a.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
                  <div className="flex items-start gap-4">
                    <Rank i={i} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">{a.name}</p>
                      <p className="text-xs text-white/30 mt-0.5">Superviseur : {a.supervisor}</p>
                      <Bar pct={Math.round((a.policesTotal / maxA) * 100)} color="bg-violet-500" />
                      {suggestion && <Suggestion text={suggestion.text} color={suggestion.color} />}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 flex-shrink-0 text-right">
                      <KPI label="Polices"  value={a.policesTotal}                          color="text-white" />
                      <KPI label="Ce mois"  value={a.policesMois}                           color="text-blue-400" />
                      <KPI label="Taux"     value={`${a.taux}%`}                            color="text-emerald-400" />
                      <KPI label="Primes"   value={a.primesTotales.toLocaleString('fr-FR')} color="text-amber-400 text-xs" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── Tab Superviseurs ── */}
      {tab === 'superviseurs' && (
        rankedSupervisors.length === 0 ? <Empty label="Aucun superviseur actif" /> : (
          <div className="flex flex-col gap-3">
            {rankedSupervisors.map((s, i) => {
              const suggestion = supervisorSuggestion(s)
              return (
                <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
                  <div className="flex items-start gap-4">
                    <Rank i={i} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">{s.name}</p>
                      <p className="text-xs text-white/30 mt-0.5">
                        {s.nbAgents} agent{s.nbAgents > 1 ? 's' : ''} · Perso : {s.perso.polices} polices ({s.perso.mois} ce mois)
                      </p>
                      <Bar pct={Math.round((s.team.polices / maxS) * 100)} color="bg-emerald-500" />
                      {suggestion && <Suggestion text={suggestion.text} color={suggestion.color} />}
                      {s.team.inactives > 0 && (
                        <p className="text-xs mt-1.5 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1 inline-block">
                          ⚠ {s.team.inactives} agent{s.team.inactives > 1 ? 's' : ''} inactif{s.team.inactives > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 flex-shrink-0 text-right">
                      <KPI label="Polices éq."  value={s.team.polices}                       color="text-white" />
                      <KPI label="Ce mois"      value={s.team.mois}                          color="text-blue-400" />
                      <KPI label="Taux éq."     value={`${s.team.taux}%`}                    color="text-emerald-400" />
                      <KPI label="Primes éq."   value={s.team.primes.toLocaleString('fr-FR')} color="text-amber-400 text-xs" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}

function TabLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors ${
        active ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white/70'
      }`}
    >
      {label}
    </Link>
  )
}

function Rank({ i }: { i: number }) {
  return (
    <span className="text-2xl w-8 text-center flex-shrink-0 mt-0.5">
      {i < 3
        ? MEDALS[i]
        : <span className="text-white/30 text-sm font-bold">#{i + 1}</span>
      }
    </span>
  )
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden w-full max-w-xs">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function Suggestion({ text, color }: { text: string; color: string }) {
  return (
    <p className={`text-xs mt-2 flex items-center gap-1.5 ${color}`}>
      <span className="font-bold">→</span> {text}
    </p>
  )
}

function KPI({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div>
      <p className="text-[10px] text-white/30 uppercase tracking-wide">{label}</p>
      <p className={`font-bold ${color}`}>{value}</p>
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="text-center text-white/30 py-16 text-sm rounded-xl border border-white/10">
      {label}
    </div>
  )
}
