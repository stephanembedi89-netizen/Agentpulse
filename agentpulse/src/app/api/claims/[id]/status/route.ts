import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

const TRANSITIONS: Record<string, string> = {
  OUVERT:      'INSTRUCTION',
  INSTRUCTION: 'CLOS',
}

const schema = z.object({
  status: z.enum(['INSTRUCTION', 'CLOS']),
})

// ─── PUT /api/claims/[id]/status ──────────────────────────────────────────────
// OUVERT → INSTRUCTION → CLOS (séquentiel)
export const PUT = withRole(['SUPERVISOR', 'MANAGER', 'SUPERADMIN'])(
  async (req, session, ctx) => {
    const { id } = ctx.params

    const body  = await req.json()
    const parse = schema.safeParse(body)
    if (!parse.success) return Response.json({ error: 'Statut invalide' }, { status: 400 })

    const claim = await prisma.claim.findUnique({
      where:   { id },
      include: { policy: { select: { companyId: true, agentId: true, agent: { select: { supervisorId: true } } } } },
    })

    if (!claim) return Response.json({ error: 'Sinistre introuvable' }, { status: 404 })
    if (claim.policy.companyId !== session.user.companyId) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Superviseur : uniquement ses polices ou celles de son équipe
    if (session.user.role === 'SUPERVISOR') {
      const isOwn  = claim.policy.agentId === session.user.id
      const isTeam = claim.policy.agent.supervisorId === session.user.id
      if (!isOwn && !isTeam) return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const expected = TRANSITIONS[claim.status]
    if (!expected) return Response.json({ error: 'Sinistre déjà clos' }, { status: 422 })
    if (parse.data.status !== expected) {
      return Response.json({ error: `Transition invalide : attendu ${expected}` }, { status: 422 })
    }

    const updated = await prisma.claim.update({
      where: { id },
      data:  { status: parse.data.status },
    })

    return Response.json(updated)
  }
)
