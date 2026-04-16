import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CommissionsClient from './CommissionsClient'

export const metadata: Metadata = { title: 'Commissions — AgentPulse' }

export default async function AgentCommissionsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const agentId = session.user.id

  const [commissions, agent] = await Promise.all([
    prisma.commission.findMany({
      where: { agentId },
      include: {
        policy: {
          select: {
            policyNumber: true,
            productType:  true,
            premium:      true,
            prospect: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { month: 'desc' },
    }),
    prisma.user.findUnique({
      where:  { id: agentId },
      select: { commissionRate: true },
    }),
  ])

  return (
    <CommissionsClient
      initialCommissions={JSON.parse(JSON.stringify(commissions))}
      commissionRate={agent?.commissionRate ?? 5}
    />
  )
}
