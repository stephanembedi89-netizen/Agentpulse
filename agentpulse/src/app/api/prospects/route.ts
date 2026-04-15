import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

// ─── GET /api/prospects ───────────────────────────────────────────────────────
// AGENT → ses propres prospects
// SUPERVISOR/MANAGER/SUPERADMIN → tous les prospects de la société
export const GET = withRole(['AGENT', 'SUPERVISOR', 'MANAGER', 'SUPERADMIN'])(
  async (_req, session) => {
    const where =
      session.user.role === 'AGENT'
        ? { agentId: session.user.id, companyId: session.user.companyId }
        : { companyId: session.user.companyId }

    const prospects = await prisma.prospect.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(prospects)
  }
)

// ─── POST /api/prospects ──────────────────────────────────────────────────────
const createSchema = z.object({
  firstName:      z.string().min(1, 'Prénom requis'),
  lastName:       z.string().min(1, 'Nom requis'),
  phone:          z.string().min(1, 'Téléphone requis'),
  email:          z.string().email().nullable().optional(),
  job:            z.string().nullable().optional(),
  estimatedPrime: z.number().positive().nullable().optional(),
})

export const POST = withRole(['AGENT', 'SUPERVISOR', 'MANAGER', 'SUPERADMIN'])(
  async (req, session) => {
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
        agentId:   session.user.id,          // toujours depuis le JWT
        companyId: session.user.companyId,   // toujours depuis le JWT
      },
    })

    // Log d'activité
    await prisma.activity.create({
      data: {
        type:      'CONTACT',
        note:      `Nouveau prospect : ${prospect.firstName} ${prospect.lastName}`,
        prospectId: prospect.id,
        userId:    session.user.id,
      },
    })

    return Response.json(prospect, { status: 201 })
  }
)
