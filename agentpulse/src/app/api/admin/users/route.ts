import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

export const GET = withRole(['SUPERADMIN'])(async () => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, role: true,
      status: true, trialExpiresAt: true, createdAt: true,
      company: { select: { id: true, name: true } },
    },
  })
  return Response.json(users)
})
