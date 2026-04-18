import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

// ─── GET /api/prospects ───────────────────────────────────────────────────────
// AGENT → ses propres prospects
// SUPERVISOR/MANAGER/SUPERADMIN → tous les prospects de la société
export const GET = withRole(['AGENT', 'SUPERVISOR', 'MANAGER', 'SUPERADMIN'])(
  async (_req, session) => {
    try {
      const where =
        session.user.role === 'AGENT'
          ? { agentId: session.user.id, companyId: session.user.companyId }
          : { companyId: session.user.companyId }

      const prospects = await prisma.prospect.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })

      return Response.json(prospects)
    } catch {
      return Response.json({ error: 'Erreur interne' }, { status: 500 })
    }
  }
)

// ─── POST /api/prospects ──────────────────────────────────────────────────────
const createSchema = z.object({
  firstName:      z.string().min(1, 'Prénom requis').max(100),
  lastName:       z.string().min(1, 'Nom requis').max(100),
  phone:          z.string().min(1, 'Téléphone requis').max(30),
  email:          z.string().email().max(254).nullable().optional(),
  job:            z.string().max(100).nullable().optional(),
  estimatedPrime: z.number().positive().max(1_000_000_000).nullable().optional(),
})

export const POST = withRole(['AGENT', 'SUPERVISOR', 'MANAGER', 'SUPERADMIN'])(
  async (req, session) => {
    try {
      const body = await req.json()
      const parse = createSchema.safeParse(body)

      if (!parse.success) {
        return Response.json(
          { error: 'Données invalides', details: parse.error.issues },
          { status: 400 }
        )
      }

      const prospect = await prisma.prospect.create({
        data: {
          ...parse.data,
          agentId:   session.user.id,
          companyId: session.user.companyId,
        },
      })

      await prisma.activity.create({
        data: {
          type:      'CONTACT',
          note:      `Nouveau prospect : ${prospect.firstName} ${prospect.lastName}`,
          prospectId: prospect.id,
          userId:    session.user.id,
        },
      })

      return Response.json(prospect, { status: 201 })
    } catch {
      return Response.json({ error: 'Erreur interne' }, { status: 500 })
    }
  }
)
