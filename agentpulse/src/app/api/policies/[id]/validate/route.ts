import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

const schema = z.object({
  action: z.enum(['VALIDER', 'RETOURNER']),
})

// ─── PUT /api/policies/[id]/validate ─────────────────────────────────────────
// VALIDER  → status EMISE + avance le prospect à EMISE
// RETOURNER → supprime la police (l'agent resoumetttra)
// Sécurité : vérifie que policy.agent.supervisorId === session.user.id
export const PUT = withRole(['SUPERVISOR', 'MANAGER', 'SUPERADMIN'])(
  async (req, session, ctx) => {
    const { id } = ctx.params

    const body  = await req.json()
    const parse = schema.safeParse(body)
    if (!parse.success) return Response.json({ error: 'Action invalide' }, { status: 400 })

    const { action } = parse.data

    const policy = await prisma.policy.findUnique({
      where:   { id },
      include: { agent: { select: { supervisorId: true, commissionRate: true } } },
    })

    if (!policy) return Response.json({ error: 'Police introuvable' }, { status: 404 })

    if (policy.companyId !== session.user.companyId) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Le superviseur doit être le superviseur assigné à l'agent
    if (
      session.user.role === 'SUPERVISOR' &&
      policy.agent.supervisorId !== session.user.id
    ) {
      return Response.json({ error: "Cet agent n'est pas dans votre équipe" }, { status: 403 })
    }

    if (policy.status !== 'SOUMISE') {
      return Response.json({ error: "La police n'est pas en attente de validation" }, { status: 422 })
    }

    if (action === 'VALIDER') {
      const updated = await prisma.policy.update({
        where: { id },
        data: { status: 'EMISE' },
      })

      // Avancer le prospect à EMISE s'il est encore à SOUMISE
      await prisma.prospect.updateMany({
        where: { id: policy.prospectId, stage: 'SOUMISE' },
        data:  { stage: 'EMISE' },
      })

      // Créer la commission automatiquement
      const rate   = policy.agent.commissionRate
      const amount = policy.premium * (rate / 100)
      const month  = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

      await prisma.commission.create({
        data: {
          amount,
          rate,
          month,
          status:    'ATTENTE',
          agentId:   policy.agentId,
          policyId:  id,
          companyId: policy.companyId,
        },
      })

      await prisma.activity.create({
        data: {
          type:       'STAGE_CHANGE',
          note:       `Police ${policy.policyNumber} validée → EMISE`,
          prospectId: policy.prospectId,
          userId:     session.user.id,
        },
      })

      return Response.json(updated)
    } else {
      // RETOURNER : suppression défensive (cascade commissions + sinistres)
      await prisma.commission.deleteMany({ where: { policyId: id } })
      await prisma.claim.deleteMany({ where: { policyId: id } })
      await prisma.policy.delete({ where: { id } })

      await prisma.activity.create({
        data: {
          type:       'NOTE',
          note:       `Police ${policy.policyNumber} retournée pour correction`,
          prospectId: policy.prospectId,
          userId:     session.user.id,
        },
      })

      return new Response(null, { status: 204 })
    }
  }
)
