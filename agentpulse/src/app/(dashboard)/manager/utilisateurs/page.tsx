import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import UtilisateursClient from './UtilisateursClient'

export const metadata: Metadata = { title: 'Utilisateurs — AgentPulse' }

export default async function UtilisateursPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const companyId = session.user.companyId

  const [users, supervisors] = await Promise.all([
    prisma.user.findMany({
      where:  { companyId },
      select: {
        id: true, name: true, email: true, role: true,
        status: true, createdAt: true, supervisorId: true,
        supervisor: { select: { name: true } },
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    }),
    prisma.user.findMany({
      where:  { companyId, role: 'SUPERVISOR', status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <UtilisateursClient
      initialUsers={JSON.parse(JSON.stringify(users))}
      supervisors={JSON.parse(JSON.stringify(supervisors))}
    />
  )
}
