import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PolicesManagerClient from './PolicesManagerClient'

export const metadata: Metadata = { title: 'Polices — AgentPulse' }

export default async function ManagerPolicesPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const companyId = session.user.companyId

  const policies = await prisma.policy.findMany({
    where: { companyId },
    select: {
      id: true, policyNumber: true, productType: true,
      premium: true, status: true, startDate: true, endDate: true, createdAt: true,
      prospect: { select: { firstName: true, lastName: true } },
      agent:    { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return <PolicesManagerClient initialPolicies={JSON.parse(JSON.stringify(policies))} />
}
