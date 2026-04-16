import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

const schema = z.object({
  type:       z.enum(['CONTACT', 'ENTRETIEN', 'ENTREVUE', 'NOTE', 'STAGE_CHANGE']),
  note:       z.string().max(500).optional(),
  prospectId: z.string().optional(),
})

// ─── POST /api/activities ─────────────────────────────────────────────────────
// Saisie rapide : enregistre une activité terrain sans prospect associé.
export const POST = withRole(['AGENT', 'SUPERVISOR', 'MANAGER', 'SUPERADMIN'])(
  async (req, session) => {
    const body  = await req.json()
    const parse = schema.safeParse(body)

    if (!parse.success) {
      return Response.json({ error: 'Données invalides' }, { status: 400 })
    }

    const activity = await prisma.activity.create({
      data: { ...parse.data, userId: session.user.id },
    })

    return Response.json(activity, { status: 201 })
  }
)
