import { prisma } from './prisma'

export interface SnapshotData {
  agentName:       string
  supervisorName:  string | null
  contacts:        number
  polices:         number
  primes:          number
  taux:            number
  commissions:     number
  activitiesCount: number
}

/**
 * Compute and persist 14-day snapshots for every active agent of a given company.
 * If companyId is omitted, processes all companies.
 */
export async function generateSnapshots(companyId?: string): Promise<number> {
  const periodEnd   = new Date()
  const periodStart = new Date(periodEnd.getTime() - 14 * 24 * 60 * 60 * 1000)

  const agents = await prisma.user.findMany({
    where: {
      role:   'AGENT',
      status: { in: ['ACTIVE', 'TRIAL'] },
      ...(companyId ? { companyId } : {}),
    },
    select: {
      id:        true,
      name:      true,
      companyId: true,
      supervisor: { select: { name: true } },
      prospects: {
        where:  { createdAt: { gte: periodStart, lte: periodEnd } },
        select: { id: true },
      },
      policies: {
        where:  { status: { in: ['EMISE', 'LIVREE'] }, createdAt: { gte: periodStart, lte: periodEnd } },
        select: { premium: true },
      },
      commissions: {
        where:  { status: { in: ['VALIDE', 'PAYE'] }, createdAt: { gte: periodStart, lte: periodEnd } },
        select: { amount: true },
      },
      activities: {
        where:  { createdAt: { gte: periodStart, lte: periodEnd } },
        select: { id: true },
      },
    },
  })

  let created = 0
  for (const agent of agents) {
    const contacts    = agent.prospects.length
    const polices     = agent.policies.length
    const primes      = agent.policies.reduce((s, p) => s + (p.premium ?? 0), 0)
    const taux        = contacts > 0 ? Math.round((polices / contacts) * 100) : 0
    const commissions = agent.commissions.reduce((s, c) => s + (c.amount ?? 0), 0)

    const data: SnapshotData = {
      agentName:       agent.name,
      supervisorName:  agent.supervisor?.name ?? null,
      contacts,
      polices,
      primes,
      taux,
      commissions,
      activitiesCount: agent.activities.length,
    }

    await prisma.agentSnapshot.create({
      data: {
        agentId:     agent.id,
        companyId:   agent.companyId,
        periodStart,
        periodEnd,
        data:        data as object,
      },
    })
    created++
  }

  return created
}
