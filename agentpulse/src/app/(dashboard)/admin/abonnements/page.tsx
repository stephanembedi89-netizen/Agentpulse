import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AbonnementsClient from './AbonnementsClient'

export const metadata: Metadata = { title: 'Abonnements — Super Admin' }

export default async function AbonnementsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERADMIN') redirect('/login')

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, createdAt: true,
      _count: { select: { users: true, policies: true } },
      users: {
        where:  { role: 'MANAGER' },
        select: { id: true, name: true, email: true, status: true, trialExpiresAt: true },
        take:   1,
      },
    },
  })

  return <AbonnementsClient initialCompanies={JSON.parse(JSON.stringify(companies))} />
}
