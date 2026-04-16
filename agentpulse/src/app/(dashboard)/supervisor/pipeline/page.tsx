import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PipelineClient from '@/app/(dashboard)/agent/pipeline/PipelineClient'

export const metadata: Metadata = { title: 'Mon Pipeline — AgentPulse' }

export default async function SupervisorPipelinePage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const prospects = await prisma.prospect.findMany({
    where: { agentId: session.user.id, companyId: session.user.companyId },
    orderBy: { createdAt: 'desc' },
  })

  return <PipelineClient initialProspects={JSON.parse(JSON.stringify(prospects))} />
}
