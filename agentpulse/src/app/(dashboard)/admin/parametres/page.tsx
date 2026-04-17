import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ParametresClient from './ParametresClient'

export const metadata: Metadata = { title: 'Paramètres — Super Admin' }

export default async function ParametresPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERADMIN') redirect('/login')
  return <ParametresClient />
}
