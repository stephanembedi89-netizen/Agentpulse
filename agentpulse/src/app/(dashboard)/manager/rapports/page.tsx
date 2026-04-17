import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import RapportsClient from './RapportsClient'

export const metadata: Metadata = { title: 'Rapports — AgentPulse' }

export default async function RapportsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  return <RapportsClient />
}
