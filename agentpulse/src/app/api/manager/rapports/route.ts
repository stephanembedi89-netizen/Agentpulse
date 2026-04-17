import { withRole } from '@/lib/withRole'
import { prisma } from '@/lib/prisma'
import { generateSnapshots } from '@/lib/snapshots'

// GET /api/manager/rapports — liste tous les snapshots de la société
export const GET = withRole(['MANAGER', 'SUPERADMIN'])(async (_req, session) => {
  try {
    const snapshots = await prisma.agentSnapshot.findMany({
      where:   { companyId: session.user.companyId },
      orderBy: { periodEnd: 'desc' },
      select: {
        id: true,
        agentId: true,
        periodStart: true,
        periodEnd: true,
        data: true,
        createdAt: true,
      },
    })
    return Response.json(snapshots)
  } catch {
    // Table not yet migrated
    return Response.json([])
  }
})

// POST /api/manager/rapports — génère manuellement un snapshot pour la société
export const POST = withRole(['MANAGER', 'SUPERADMIN'])(async (_req, session) => {
  try {
    const count = await generateSnapshots(session.user.companyId)
    return Response.json({ ok: true, snapshotsCreated: count })
  } catch (err) {
    console.error('manual snapshot error', err)
    return Response.json({ error: 'Erreur — vérifiez que la migration prisma est appliquée' }, { status: 500 })
  }
})
