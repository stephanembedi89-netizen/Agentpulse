import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PolicesClient from './PolicesClient'

export const metadata: Metadata = { title: 'Mes Polices — AgentPulse' }

export default async function AgentPolicesPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const agentId   = session.user.id
  const companyId = session.user.companyId

  const [policies, prospects] = await Promise.all([
    prisma.policy.findMany({
      where: { agentId, companyId },
      include: {
        prospect: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Prospects éligibles = stage EMISE ou LIVRAISON (prospect converti)
    prisma.prospect.findMany({
      where: {
        agentId,
        companyId,
        stage: { in: ['EMISE', 'LIVRAISON', 'SOUMISE'] },
      },
      select: { id: true, firstName: true, lastName: true, stage: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  return (
    <PolicesClient
      initialPolicies={JSON.parse(JSON.stringify(policies))}
      prospects={JSON.parse(JSON.stringify(prospects))}
    />
  )
}
