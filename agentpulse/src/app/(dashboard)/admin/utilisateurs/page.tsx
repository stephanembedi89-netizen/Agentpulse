import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UtilisateursAdminClient from './UtilisateursAdminClient'

export const metadata: Metadata = { title: 'Utilisateurs — Super Admin' }

export default async function UtilisateursAdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERADMIN') redirect('/login')
  return <UtilisateursAdminClient />
}
