import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

const schema = z.object({
  status:       z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  supervisorId: z.string().nullable().optional(),
})

// ─── PATCH /api/users/[id] ────────────────────────────────────────────────────
// Update status (enable/disable) or supervisorId assignment
export const PATCH = withRole(['MANAGER', 'SUPERADMIN'])(
  async (req, session, ctx) => {
    const { id } = ctx.params

    const body  = await req.json()
    const parse = schema.safeParse(body)
    if (!parse.success) {
      return Response.json({ error: 'Données invalides', details: parse.error.issues }, { status: 400 })
    }

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return Response.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    if (target.companyId !== session.user.companyId) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }
    if (target.role === 'SUPERADMIN') {
      return Response.json({ error: 'Impossible de modifier un SUPERADMIN' }, { status: 403 })
    }
    // Manager cannot modify another MANAGER unless SUPERADMIN
    if (target.role === 'MANAGER' && session.user.role !== 'SUPERADMIN') {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const data: Record<string, unknown> = {}
    if (parse.data.status !== undefined)       data.status       = parse.data.status
    if (parse.data.supervisorId !== undefined)  data.supervisorId = parse.data.supervisorId

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, name: true, email: true, role: true,
        status: true, supervisorId: true,
      },
    })

    return Response.json(updated)
  }
)
