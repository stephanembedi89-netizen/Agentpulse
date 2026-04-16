import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

const schema = z.object({
  policyId:    z.string().min(1, 'Police requise'),
  description: z.string().min(1, 'Description requise'),
  amount:      z.number().positive().nullable().optional(),
})

// ─── POST /api/claims ─────────────────────────────────────────────────────────
export const POST = withRole(['SUPERVISOR', 'MANAGER', 'SUPERADMIN'])(
  async (req, session) => {
    const body  = await req.json()
    const parse = schema.safeParse(body)
    if (!parse.success) {
      return Response.json({ error: 'Données invalides', details: parse.error.issues }, { status: 400 })
    }

    const policy = await prisma.policy.findUnique({
      where: { id: parse.data.policyId },
      include: { agent: { select: { supervisorId: true } } },
    })

    if (!policy) return Response.json({ error: 'Police introuvable' }, { status: 404 })
    if (policy.companyId !== session.user.companyId) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Superviseur : police de lui-même ou d'un de ses agents
    if (session.user.role === 'SUPERVISOR') {
      const isOwn  = policy.agentId === session.user.id
      const isTeam = policy.agent.supervisorId === session.user.id
      if (!isOwn && !isTeam) return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const claim = await prisma.claim.create({
      data: {
        claimNumber: `SIN-${Date.now()}`,
        description: parse.data.description,
        amount:      parse.data.amount ?? null,
        policyId:    parse.data.policyId,
      },
    })

    return Response.json(claim, { status: 201 })
  }
)
