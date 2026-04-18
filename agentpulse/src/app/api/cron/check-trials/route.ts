import { prisma } from '@/lib/prisma'
import { sendTrialReminderEmail } from '@/lib/email'

// ─── GET /api/cron/check-trials ───────────────────────────────────────────────
// Appelé chaque nuit à minuit par Vercel Cron (vercel.json)
// Sécurisé par CRON_SECRET
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now      = new Date()
  const in3days  = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const in4days  = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)

  // 1. Relance : trialExpiresAt dans exactement 3 jours (fenêtre de 24h)
  const expiringSoon = await prisma.user.findMany({
    where: {
      status:         'TRIAL',
      trialExpiresAt: { gte: in3days, lt: in4days },
    },
    select: { id: true, name: true, email: true, trialExpiresAt: true },
  })

  let reminded = 0
  for (const user of expiringSoon) {
    const daysLeft = Math.ceil(
      (user.trialExpiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    await sendTrialReminderEmail({ to: user.email, name: user.name, daysLeft }).catch(console.error)
    reminded++
  }

  // 2. Expiration : trialExpiresAt dépassé → EXPIRED
  const { count: expired } = await prisma.user.updateMany({
    where: {
      status:         'TRIAL',
      trialExpiresAt: { lt: now },
    },
    data: { status: 'EXPIRED' },
  })

  return Response.json({ ok: true, reminded, expired, checkedAt: now.toISOString() })
}
