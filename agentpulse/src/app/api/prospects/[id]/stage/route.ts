import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'
import type { ProspectStage } from '@prisma/client'

// Séquence strictement ordonnée
const STAGE_ORDER: ProspectStage[] = [
  'CONTACT',
  'ENTRETIEN',
  'ENTREVUE',
  'SOUMISE',
  'EMISE',
  'LIVRAISON',
]

const stageSchema = z.object({
  stage: z.enum(['CONTACT', 'ENTRETIEN', 'ENTREVUE', 'SOUMISE', 'EMISE', 'LIVRAISON']),
})

// ─── PUT /api/prospects/[id]/stage ────────────────────────────────────────────
// Valide que la nouvelle étape est exactement +1 par rapport à l'étape courante
export const PUT = withRole(['AGENT', 'SUPERVISOR', 'MANAGER', 'SUPERADMIN'])(
  async (req, session, ctx) => {
    const { id } = ctx.params

    const body = await req.json()
    const parse = stageSchema.safeParse(body)

    if (!parse.success) {
      return Response.json({ error: 'Étape invalide' }, { status: 400 })
    }

    const { stage: newStage } = parse.data

    const prospect = await prisma.prospect.findUnique({ where: { id } })

    if (!prospect) {
      return Response.json({ error: 'Prospect introuvable' }, { status: 404 })
    }

    // Cloisonnement société
    if (prospect.companyId !== session.user.companyId) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Un agent ne peut modifier que ses propres prospects
    if (session.user.role === 'AGENT' && prospect.agentId !== session.user.id) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Validation séquentielle : avancer d'exactement une étape
    const currentIdx = STAGE_ORDER.indexOf(prospect.stage)
    const newIdx     = STAGE_ORDER.indexOf(newStage)

    if (newIdx !== currentIdx + 1) {
      return Response.json(
        { error: "Vous ne pouvez avancer qu'une étape à la fois" },
        { status: 422 }
      )
    }

    const updated = await prisma.prospect.update({
      where: { id },
      data:  { stage: newStage },
    })

    // Journal d'activité
    await prisma.activity.create({
      data: {
        type:      'STAGE_CHANGE',
        note:      `${prospect.stage} → ${newStage}`,
        prospectId: id,
        userId:    session.user.id,
      },
    })

    return Response.json(updated)
  }
)
