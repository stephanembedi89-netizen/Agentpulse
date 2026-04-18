import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import UtilisateursAdminClient from './UtilisateursAdminClient'

export const metadata: Metadata = { title: 'Utilisateurs — Super Admin' }

export default async function UtilisateursAdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERADMIN') redirect('/login')

  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, name: true, email: true, role: true,
      status: true, createdAt: true, trialExpiresAt: true,
      company: { select: { id: true, name: true } },
    },
  })

  return <UtilisateursAdminClient initialUsers={JSON.parse(JSON.stringify(users))} />
}
