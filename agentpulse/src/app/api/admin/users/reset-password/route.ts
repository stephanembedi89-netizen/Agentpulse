import { prisma } from '@/lib/prisma'
import { withRole } from '@/lib/withRole'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const schema = z.object({ userId: z.string().min(1) })

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(12)
  return Array.from(bytes).map(b => chars[b % chars.length]).join('')
}

export const POST = withRole(['SUPERADMIN'])(async (req) => {
  try {
    const body  = await req.json()
    const parse = schema.safeParse(body)
    if (!parse.success) return Response.json({ error: 'userId requis' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: parse.data.userId } })
    if (!user) return Response.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    const newPassword  = generateSecurePassword()
    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

    return Response.json({ temporaryPassword: newPassword, email: user.email })
  } catch {
    return Response.json({ error: 'Erreur interne' }, { status: 500 })
  }
})
