import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'

const schema = z.object({
  name:         z.string().min(2, 'Nom requis'),
  email:        z.string().email('Email invalide'),
  password:     z.string().min(6, 'Mot de passe min 6 caractères'),
  role:         z.enum(['AGENT', 'SUPERVISOR']),
  supervisorId: z.string().optional().nullable(),
})

// ─── POST /api/users ──────────────────────────────────────────────────────────
export const POST = withRole(['MANAGER', 'SUPERADMIN'])(
  async (req, session) => {
    const body  = await req.json()
    const parse = schema.safeParse(body)
    if (!parse.success) {
      return Response.json({ error: 'Données invalides', details: parse.error.issues }, { status: 400 })
    }

    const { name, email, password, role, supervisorId } = parse.data

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return Response.json({ error: 'Email déjà utilisé' }, { status: 409 })

    const hashed = await bcrypt.hash(password, 10)

    const trialExpiresAt = new Date()
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 30)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash:  hashed,
        role,
        companyId:     session.user.companyId,
        supervisorId:  role === 'AGENT' ? (supervisorId ?? null) : null,
        trialExpiresAt,
      },
      select: {
        id: true, name: true, email: true, role: true,
        status: true, supervisorId: true, createdAt: true,
      },
    })

    return Response.json(user, { status: 201 })
  }
)
