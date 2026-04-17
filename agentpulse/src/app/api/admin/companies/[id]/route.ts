import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'
import { z } from 'zod'

const schema = z.object({
  action:        z.enum(['activate', 'suspend', 'reactivate', 'extend_trial', 'edit']).optional(),
  extraDays:     z.number().int().min(1).max(365).optional(),
  name:          z.string().min(2).optional(),
  primaryColor:  z.string().optional(),
  secondaryColor: z.string().optional(),
  logoUrl:       z.string().url().nullable().optional(),
})

export const PATCH = withRole(['SUPERADMIN'])(async (req, _session, ctx) => {
  const id    = ctx.params.id
  const body  = await req.json()
  const parse = schema.safeParse(body)
  if (!parse.success) return Response.json({ error: 'Données invalides' }, { status: 400 })

  const company = await prisma.company.findUnique({
    where: { id },
    include: { users: { where: { role: 'MANAGER' }, take: 1 } },
  })
  if (!company) return Response.json({ error: 'Société introuvable' }, { status: 404 })

  const { action, extraDays, name, primaryColor, secondaryColor, logoUrl } = parse.data

  // Edit company details
  if (action === 'edit' || (!action && (name || primaryColor || secondaryColor || logoUrl !== undefined))) {
    await prisma.company.update({
      where: { id },
      data: {
        ...(name          !== undefined && { name }),
        ...(primaryColor  !== undefined && { primaryColor }),
        ...(secondaryColor !== undefined && { secondaryColor }),
        ...(logoUrl       !== undefined && { logoUrl }),
      },
    })
    return Response.json({ ok: true })
  }

  const manager = company.users[0]
  if (!manager) return Response.json({ error: 'Aucun manager trouvé' }, { status: 404 })

  if (action === 'activate') {
    await prisma.user.updateMany({
      where: { companyId: id, status: { in: ['TRIAL', 'EXPIRED'] } },
      data:  { status: 'ACTIVE', trialExpiresAt: null },
    })
  } else if (action === 'suspend') {
    await prisma.user.updateMany({
      where: { companyId: id },
      data:  { status: 'SUSPENDED' },
    })
  } else if (action === 'reactivate') {
    await prisma.user.updateMany({
      where: { companyId: id, status: 'SUSPENDED' },
      data:  { status: 'ACTIVE' },
    })
  } else if (action === 'extend_trial') {
    const days    = extraDays ?? 7
    const current = manager.trialExpiresAt && manager.trialExpiresAt > new Date()
      ? manager.trialExpiresAt
      : new Date()
    const newDate = new Date(current.getTime() + days * 24 * 60 * 60 * 1000)
    await prisma.user.updateMany({
      where: { companyId: id },
      data:  { status: 'TRIAL', trialExpiresAt: newDate },
    })
  }

  return Response.json({ ok: true })
})
