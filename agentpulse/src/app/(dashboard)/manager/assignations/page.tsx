import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AssignationsClient from './AssignationsClient'

export const metadata: Metadata = { title: 'Assignations — AgentPulse' }

export default async function AssignationsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const companyId = session.user.companyId

  const [agents, supervisors] = await Promise.all([
    prisma.user.findMany({
      where:   { companyId, role: 'AGENT', status: { in: ['ACTIVE', 'TRIAL'] } },
      select:  { id: true, name: true, email: true, supervisorId: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where:   { companyId, role: 'SUPERVISOR', status: { in: ['ACTIVE', 'TRIAL'] } },
      select:  { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <AssignationsClient
      initialAgents={JSON.parse(JSON.stringify(agents))}
      supervisors={JSON.parse(JSON.stringify(supervisors))}
    />
  )
}
