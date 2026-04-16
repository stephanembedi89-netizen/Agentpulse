import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

const schema = z.object({
  action: z.enum(['VALIDER', 'CONTESTER']),
  note:   z.string().optional(),
})

// ─── PUT /api/commissions/[id]/validate ──────────────────────────────────────
// VALIDER   → status VALIDE + approvedBy = session.user.id
// CONTESTER → log NOTE activity, keep ATTENTE (no REJETE in schema)
export const PUT = withRole(['MANAGER', 'SUPERADMIN'])(
  async (req, session, ctx) => {
    const { id } = ctx.params

    const body  = await req.json()
    const parse = schema.safeParse(body)
    if (!parse.success) return Response.json({ error: 'Action invalide' }, { status: 400 })

    const { action, note } = parse.data

    const commission = await prisma.commission.findUnique({
      where: { id },
      include: { policy: { select: { companyId: true, prospectId: true } } },
    })

    if (!commission) return Response.json({ error: 'Commission introuvable' }, { status: 404 })
    if (commission.policy.companyId !== session.user.companyId) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    if (commission.status !== 'ATTENTE') {
      return Response.json({ error: 'Commission déjà traitée' }, { status: 422 })
    }

    if (action === 'VALIDER') {
      const updated = await prisma.commission.update({
        where: { id },
        data:  { status: 'VALIDE', approvedBy: session.user.id },
      })

      await prisma.activity.create({
        data: {
          type:       'NOTE',
          note:       `Commission #${commission.id.slice(-6)} validée par le manager`,
          prospectId: commission.policy.prospectId,
          userId:     session.user.id,
        },
      })

      return Response.json(updated)
    } else {
      // CONTESTER : log une activité, commission reste ATTENTE
      await prisma.activity.create({
        data: {
          type:       'NOTE',
          note:       `Commission #${commission.id.slice(-6)} contestée${note ? ` : ${note}` : ''}`,
          prospectId: commission.policy.prospectId,
          userId:     session.user.id,
        },
      })

      return Response.json({ ...commission, _contested: true })
    }
  }
)
