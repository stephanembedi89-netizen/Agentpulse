import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SupervisorHomeClient from './SupervisorHomeClient'

export const metadata: Metadata = { title: 'Espace Superviseur — AgentPulse' }

export default async function SupervisorDashboard() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const agentId   = session.user.id
  const companyId = session.user.companyId

  const now          = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // ── Stats personnelles (le superviseur est aussi agent commercial) ───────────
  const personalProspects = await prisma.prospect.findMany({
    where:  { agentId, companyId },
    select: { stage: true, estimatedPrime: true, updatedAt: true },
  })

  const total = personalProspects.length

  const STAGE_KEYS = ['CONTACT', 'ENTRETIEN', 'ENTREVUE', 'SOUMISE', 'EMISE', 'LIVRAISON'] as const
  const pipeline = Object.fromEntries(
    STAGE_KEYS.map(s => [s, personalProspects.filter(p => p.stage === s).length])
  ) as Record<typeof STAGE_KEYS[number], number>

  const policesEmisesMois = personalProspects.filter(
    p => (p.stage === 'EMISE' || p.stage === 'LIVRAISON') && p.updatedAt >= startOfMonth
  ).length

  const withPrime    = personalProspects.filter(p => (p.estimatedPrime ?? 0) > 0)
  const primeMoyenne = withPrime.length > 0
    ? Math.round(withPrime.reduce((s, p) => s + (p.estimatedPrime ?? 0), 0) / withPrime.length)
    : 0

  const livraisons = pipeline['LIVRAISON']
  const tauxGlobal = total > 0 ? Math.round((livraisons / total) * 100) : 0

  const atEntretienPlus   = personalProspects.filter(p => ['ENTRETIEN','ENTREVUE','SOUMISE','EMISE','LIVRAISON'].includes(p.stage)).length
  const atEntrevuePlus    = personalProspects.filter(p => ['ENTREVUE','SOUMISE','EMISE','LIVRAISON'].includes(p.stage)).length
  const atSoumisePlus     = personalProspects.filter(p => ['SOUMISE','EMISE','LIVRAISON'].includes(p.stage)).length
  const atEmisePlus       = personalProspects.filter(p => ['EMISE','LIVRAISON'].includes(p.stage)).length

  const tauxTerrain       = total           > 0 ? Math.round((atEntretienPlus / total)           * 100) : 0
  const tauxQualification = atEntretienPlus > 0 ? Math.round((atEntrevuePlus  / atEntretienPlus) * 100) : 0
  const soumisesEmises    = atSoumisePlus   > 0 ? Math.round((atEmisePlus     / atSoumisePlus)   * 100) : 0

  const primeJournaliere = personalProspects
    .filter(p => p.stage === 'LIVRAISON' && p.updatedAt >= startOfDay)
    .reduce((s, p) => s + (p.estimatedPrime ?? 0), 0)

  // ── Top 3 équipe ────────────────────────────────────────────────────────────
  const myAgents = await prisma.user.findMany({
    where:  { supervisorId: agentId, companyId },
    select: { id: true, name: true },
  })

  const agentIds = myAgents.map(a => a.id)

  const teamProspects = agentIds.length > 0
    ? await prisma.prospect.findMany({
        where:  { agentId: { in: agentIds }, companyId },
        select: { agentId: true, stage: true, updatedAt: true },
      })
    : []

  const top3 = myAgents
    .map(agent => {
      const prospects   = teamProspects.filter(p => p.agentId === agent.id)
      const t           = prospects.length
      const policesMois = prospects.filter(p =>
        (p.stage === 'EMISE' || p.stage === 'LIVRAISON') && p.updatedAt >= startOfMonth
      ).length
      const taux = t > 0
        ? Math.round((prospects.filter(p => p.stage === 'LIVRAISON').length / t) * 100)
        : 0
      return { id: agent.id, name: agent.name, policesMois, tauxGlobal: taux, total: t }
    })
    .sort((a, b) => b.policesMois - a.policesMois)
    .slice(0, 3)

  const stats = {
    banner: {
      policesEmisesMois,
      primeMoyenne,
      tauxGlobal,
      objectifMensuel: 15,
      dateAujourdhui:  now.toISOString().split('T')[0],
    },
    pipeline,
    ratios: {
      tauxGlobal,
      primeJournaliere,
      soumisesEmises,
      tauxTerrain,
      tauxQualification,
      livraisons,
    },
  }

  return <SupervisorHomeClient stats={stats} top3={top3} />
}
