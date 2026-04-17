import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

export const GET = withRole(['SUPERADMIN'])(async () => {
  const [companies, users, policies, commissions] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.policy.count(),
    prisma.commission.aggregate({ _sum: { amount: true } }),
  ])
  return Response.json({
    companies,
    users,
    policies,
    commissions: commissions._sum.amount ?? 0,
  })
})
