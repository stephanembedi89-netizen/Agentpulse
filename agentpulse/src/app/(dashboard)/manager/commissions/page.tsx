import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CommissionsClient from './CommissionsClient'

export const metadata: Metadata = { title: 'Commissions — AgentPulse' }

export default async function ManagerCommissionsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const companyId = session.user.companyId

  const commissions = await prisma.commission.findMany({
    where: { policy: { companyId } },
    include: {
      policy: {
        include: {
          prospect: { select: { firstName: true, lastName: true } },
          agent:    { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <CommissionsClient
      initialCommissions={JSON.parse(JSON.stringify(commissions))}
    />
  )
}
