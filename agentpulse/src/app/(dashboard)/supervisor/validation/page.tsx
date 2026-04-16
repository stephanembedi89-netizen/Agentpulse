import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ValidationClient from './ValidationClient'

export const metadata: Metadata = { title: 'Polices à valider — AgentPulse' }

export default async function SupervisorValidationPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const policies = await prisma.policy.findMany({
    where: {
      status:    'SOUMISE',
      companyId: session.user.companyId,
      agent:     { supervisorId: session.user.id },
    },
    include: {
      prospect: { select: { firstName: true, lastName: true } },
      agent:    { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return <ValidationClient initialPolicies={JSON.parse(JSON.stringify(policies))} />
}
