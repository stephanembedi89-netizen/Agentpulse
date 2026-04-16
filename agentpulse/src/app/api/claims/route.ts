import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

const schema = z.object({
  policyId:    z.string().min(1, 'Police requise'),
  description: z.string().min(1, 'Description requise'),
  amount:      z.number().positive().nullable().optional(),
})

function generateClaimNumber(): string {
  const year   = new Date().getFullYear()
  const digits = String(Math.floor(1000 + Math.random() * 9000))
  return `SIN-${year}-${digits}`
}

// ─── GET /api/claims ──────────────────────────────────────────────────────────
export const GET = withRole(['AGENT', 'SUPERVISOR', 'MANAGER', 'SUPERADMIN'])(
  async (_req, session) => {
    const claims = await prisma.claim.findMany({
      where: { policy: { companyId: session.user.companyId } },
      include: {
        policy: {
          include: {
            prospect: { select: { firstName: true, lastName: true } },
            agent:    { select: { name: true } },
          },
        },
      },
      orderBy: { declaredAt: 'desc' },
    })
    return Response.json(claims)
  }
)

// ─── POST /api/claims ─────────────────────────────────────────────────────────
export const POST = withRole(['AGENT', 'SUPERVISOR', 'MANAGER', 'SUPERADMIN'])(
  async (req, session) => {
    const body  = await req.json()
    const parse = schema.safeParse(body)
    if (!parse.success) {
      return Response.json({ error: 'Données invalides', details: parse.error.issues }, { status: 400 })
    }

    const policy = await prisma.policy.findUnique({
      where:   { id: parse.data.policyId },
      include: { agent: { select: { supervisorId: true } } },
    })

    if (!policy) return Response.json({ error: 'Police introuvable' }, { status: 404 })
    if (policy.companyId !== session.user.companyId) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Agent : uniquement ses propres polices
    if (session.user.role === 'AGENT' && policy.agentId !== session.user.id) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Superviseur : police de lui-même ou d'un de ses agents
    if (session.user.role === 'SUPERVISOR') {
      const isOwn  = policy.agentId === session.user.id
      const isTeam = policy.agent.supervisorId === session.user.id
      if (!isOwn && !isTeam) return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    let claimNumber = generateClaimNumber()
    let attempt = 0
    while (await prisma.claim.findUnique({ where: { claimNumber } }) && attempt < 5) {
      claimNumber = generateClaimNumber()
      attempt++
    }

    const claim = await prisma.claim.create({
      data: {
        claimNumber,
        description: parse.data.description,
        amount:      parse.data.amount ?? null,
        policyId:    parse.data.policyId,
      },
    })

    return Response.json(claim, { status: 201 })
  }
)
