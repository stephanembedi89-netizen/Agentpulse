import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AbonnementsClient from './AbonnementsClient'

export const metadata: Metadata = { title: 'Abonnements — Super Admin' }

export default async function AbonnementsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERADMIN') redirect('/login')
  return <AbonnementsClient />
}
