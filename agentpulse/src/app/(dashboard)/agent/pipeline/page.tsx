import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PipelineClient from './PipelineClient'

export const metadata: Metadata = { title: 'Pipeline — AgentPulse' }

export default async function PipelinePage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const prospects = await prisma.prospect.findMany({
    where: {
      agentId:   session.user.id,
      companyId: session.user.companyId,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Sérialisation des dates pour le client
  return <PipelineClient initialProspects={JSON.parse(JSON.stringify(prospects))} />
}
