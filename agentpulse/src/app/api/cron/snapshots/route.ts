import { generateSnapshots } from '@/lib/snapshots'

// GET /api/cron/snapshots
// Planifié : 1er et 15 de chaque mois à minuit (vercel.json)
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const count = await generateSnapshots()
    return Response.json({ ok: true, snapshotsCreated: count, at: new Date().toISOString() })
  } catch (err) {
    console.error('snapshot cron error', err)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
