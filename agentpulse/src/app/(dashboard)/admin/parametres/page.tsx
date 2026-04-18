import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ParametresClient from './ParametresClient'

export const metadata: Metadata = { title: 'Paramètres — Super Admin' }

export default async function ParametresPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERADMIN') redirect('/login')

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, name: true, logoUrl: true, primaryColor: true, secondaryColor: true,
      users: { where: { role: 'MANAGER' }, select: { name: true, email: true }, take: 1 },
    },
  })

  return <ParametresClient initialCompanies={JSON.parse(JSON.stringify(companies))} />
}
