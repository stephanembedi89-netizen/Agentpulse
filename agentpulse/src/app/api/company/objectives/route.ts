import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'
import { z } from 'zod'

const schema = z.object({
  contactsMois:   z.number().int().min(0),
  policiesMois:   z.number().int().min(0),
  primeCible:     z.number().min(0),
  tauxCommission: z.number().min(0).max(100),
})

export const GET = withRole(['MANAGER', 'SUPERADMIN'])(async (_req, session) => {
  try {
    const company = await prisma.company.findUnique({
      where:  { id: session.user.companyId },
      select: { objectives: true },
    })
    return Response.json(company?.objectives ?? null)
  } catch {
    return Response.json(null)
  }
})

export const PATCH = withRole(['MANAGER', 'SUPERADMIN'])(async (req, session) => {
  const body  = await req.json()
  const parse = schema.safeParse(body)
  if (!parse.success) return Response.json({ error: 'Données invalides' }, { status: 400 })

  try {
    await prisma.company.update({
      where: { id: session.user.companyId },
      data:  { objectives: parse.data },
    })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Migration en attente — exécutez prisma db push' }, { status: 500 })
  }
})
