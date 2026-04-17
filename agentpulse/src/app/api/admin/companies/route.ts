import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

export const GET = withRole(['SUPERADMIN'])(async () => {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { users: true, policies: true } },
      users: {
        where: { role: 'MANAGER' },
        select: { id: true, name: true, email: true, status: true, trialExpiresAt: true },
        take: 1,
      },
    },
  })
  return Response.json(companies)
})

const schema = z.object({
  companyName:   z.string().min(2),
  managerName:   z.string().min(2),
  managerEmail:  z.string().email(),
  managerPhone:  z.string().optional(),
  primaryColor:  z.string().optional(),
  secondaryColor: z.string().optional(),
})

export const POST = withRole(['SUPERADMIN'])(async (req) => {
  const body  = await req.json()
  const parse = schema.safeParse(body)
  if (!parse.success) return Response.json({ error: 'Données invalides' }, { status: 400 })

  const { companyName, managerName, managerEmail, managerPhone, primaryColor, secondaryColor } = parse.data

  const exists = await prisma.user.findUnique({ where: { email: managerEmail } })
  if (exists) return Response.json({ error: 'Email déjà utilisé' }, { status: 409 })

  const password = Math.random().toString(36).slice(-8) + 'A1!'
  const passwordHash = await bcrypt.hash(password, 10)

  const trialExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

  const company = await prisma.$transaction(async (tx) => {
    const newCompany = await tx.company.create({
      data: {
        name: companyName,
        primaryColor:   primaryColor   ?? '#3B82F6',
        secondaryColor: secondaryColor ?? '#10B981',
      },
    })
    await tx.user.create({
      data: {
        name: managerName,
        email: managerEmail,
        phone: managerPhone,
        passwordHash,
        role: 'MANAGER',
        status: 'TRIAL',
        trialExpiresAt,
        companyId: newCompany.id,
      },
    })
    return newCompany
  })

  return Response.json({ company, temporaryPassword: password }, { status: 201 })
})
