import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

// ─── GET /api/company/theme ───────────────────────────────────────────────────
export const GET = withRole(['AGENT', 'SUPERVISOR', 'MANAGER', 'SUPERADMIN'])(
  async (_req, session) => {
    const company = await prisma.company.findUnique({
      where:  { id: session.user.companyId },
      select: { logoUrl: true, primaryColor: true, secondaryColor: true },
    })

    if (!company) return Response.json({ error: 'Société introuvable' }, { status: 404 })

    return Response.json(company)
  }
)
