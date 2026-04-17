import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'

const schema = z.object({
  firstName: z.string().min(2),
  lastName:  z.string().min(2),
  company:   z.string().min(2),
  role:      z.string().min(2),
  email:     z.string().email(),
  phone:     z.string().min(6),
})

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ─── POST /api/demo ───────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const body  = await req.json()
  const parse = schema.safeParse(body)
  if (!parse.success) {
    return Response.json({ error: 'Données invalides', details: parse.error.issues }, { status: 400 })
  }

  const { firstName, lastName, company, email, phone } = parse.data

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return Response.json({ error: 'Un compte existe déjà avec cet email' }, { status: 409 })

  const password    = generatePassword()
  const hashed      = await bcrypt.hash(password, 10)
  const trialExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

  // Créer la société + le compte Manager en transaction
  const user = await prisma.$transaction(async (tx) => {
    const newCompany = await tx.company.create({
      data: { name: company },
    })

    return tx.user.create({
      data: {
        name:           `${firstName} ${lastName}`,
        email,
        phone,
        passwordHash:   hashed,
        role:           'MANAGER',
        status:         'TRIAL',
        trialExpiresAt: trialExpiry,
        companyId:      newCompany.id,
      },
    })
  })

  // Email de bienvenue (non bloquant)
  sendWelcomeEmail({
    to:             email,
    name:           firstName,
    password,
    trialExpiresAt: trialExpiry,
    companyName:    company,
  }).catch(console.error)

  return Response.json({ ok: true, email: user.email }, { status: 201 })
}
