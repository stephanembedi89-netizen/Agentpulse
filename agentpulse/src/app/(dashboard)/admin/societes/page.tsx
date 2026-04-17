import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SocietesClient from './SocietesClient'

export const metadata: Metadata = { title: 'Sociétés — Super Admin' }

export default async function SocietesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERADMIN') redirect('/login')
  return <SocietesClient />
}
