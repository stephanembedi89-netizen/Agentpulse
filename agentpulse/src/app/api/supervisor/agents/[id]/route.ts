import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

export const GET = withRole(['SUPERVISOR'])(async (_req, session, ctx) => {
  const agentId     = ctx.params.id
  const supervisorId = session.user.id

  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    select: { id: true, name: true, email: true, phone: true, commissionRate: true, status: true, createdAt: true, supervisorId: true },
  })
  if (!agent || agent.supervisorId !== supervisorId) {
    return Response.json({ error: 'Agent introuvable' }, { status: 404 })
  }

  const now          = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [prospects, policies, commissions, activities] = await Promise.all([
    prisma.prospect.findMany({
      where: { agentId },
      select: { stage: true, estimatedPrime: true, firstName: true, lastName: true, updatedAt: true, createdAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.policy.findMany({
      where: { agentId },
      select: { status: true, premium: true, policyNumber: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.commission.findMany({
      where: { agentId },
      select: { amount: true, status: true },
    }),
    prisma.activity.findMany({
      where: { userId: agentId },
      select: { type: true, note: true, createdAt: true, prospect: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  const STAGES = ['CONTACT', 'ENTRETIEN', 'ENTREVUE', 'SOUMISE', 'EMISE', 'LIVRAISON']
  const pipeline = Object.fromEntries(STAGES.map(s => [s, prospects.filter(p => p.stage === s).length]))

  const total        = prospects.length
  const livraisons   = pipeline['LIVRAISON']
  const tauxGlobal   = total > 0 ? Math.round((livraisons / total) * 100) : 0
  const policiesMois = policies.filter(p => p.createdAt >= startOfMonth).length
  const totalCommissions = commissions.reduce((s, c) => s + c.amount, 0)

  return Response.json({ agent, pipeline, total, tauxGlobal, policiesMois, totalCommissions, policies, activities })
})
