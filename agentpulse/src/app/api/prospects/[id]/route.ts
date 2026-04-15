import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

// ─── DELETE /api/prospects/[id] ───────────────────────────────────────────────
export const DELETE = withRole(['AGENT', 'SUPERVISOR', 'MANAGER', 'SUPERADMIN'])(
  async (_req, session, ctx) => {
    const { id } = ctx.params

    const prospect = await prisma.prospect.findUnique({ where: { id } })

    if (!prospect) {
      return Response.json({ error: 'Prospect introuvable' }, { status: 404 })
    }

    // Cloisonnement société
    if (prospect.companyId !== session.user.companyId) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Un agent ne peut supprimer que ses propres prospects
    if (session.user.role === 'AGENT' && prospect.agentId !== session.user.id) {
      return Response.json({ error: 'Accès refusé' }, { status: 403 })
    }

    await prisma.prospect.delete({ where: { id } })

    return new Response(null, { status: 204 })
  }
)
