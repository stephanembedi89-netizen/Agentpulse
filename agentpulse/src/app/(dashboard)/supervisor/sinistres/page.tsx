import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SinistresClient from './SinistresClient'

export const metadata: Metadata = { title: 'Sinistres — AgentPulse' }

export default async function SupervisorSinistresPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const companyId   = session.user.companyId
  const supervisorId = session.user.id

  // Sinistres : polices de l'équipe ou personnelles
  const claims = await prisma.claim.findMany({
    where: {
      policy: {
        companyId,
        OR: [
          { agentId: supervisorId },
          { agent: { supervisorId } },
        ],
      },
    },
    include: {
      policy: {
        include: {
          prospect: { select: { firstName: true, lastName: true } },
          agent:    { select: { name: true } },
        },
      },
    },
    orderBy: { declaredAt: 'desc' },
  })

  // Polices éligibles pour déclaration (EMISE ou LIVREE)
  const eligiblePolicies = await prisma.policy.findMany({
    where: {
      companyId,
      status: { in: ['EMISE', 'LIVREE'] },
      OR: [
        { agentId: supervisorId },
        { agent: { supervisorId } },
      ],
    },
    include: { prospect: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <SinistresClient
      initialClaims={JSON.parse(JSON.stringify(claims))}
      policies={JSON.parse(JSON.stringify(eligiblePolicies))}
    />
  )
}
