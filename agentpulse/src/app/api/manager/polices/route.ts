import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

export const GET = withRole(['MANAGER', 'SUPERADMIN'])(async (_req, session) => {
  try {
    const policies = await prisma.policy.findMany({
      where: { companyId: session.user.companyId },
      select: {
        id: true, policyNumber: true, productType: true,
        premium: true, status: true, startDate: true, endDate: true, createdAt: true,
        prospect: { select: { firstName: true, lastName: true } },
        agent:    { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return Response.json(policies)
  } catch {
    return Response.json({ error: 'Erreur interne' }, { status: 500 })
  }
})
