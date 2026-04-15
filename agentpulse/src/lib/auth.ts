import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// ─── Rate limiter in-memory (max 5 tentatives / IP / 15 min) ──────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const RATE_MAX = 5
const RATE_WINDOW = 15 * 60 * 1000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const rec = loginAttempts.get(ip)
  if (!rec || now > rec.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return false
  }
  if (rec.count >= RATE_MAX) return true
  rec.count++
  return false
}

function clearRateLimit(ip: string) {
  loginAttempts.delete(ip)
}

// ─── Validation ───────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// ─── Auth Options ─────────────────────────────────────────────────────────────
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials, req) {
        // Extraire l'IP
        const ip =
          (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
          (req.headers?.['x-real-ip'] as string) ??
          'unknown'

        if (isRateLimited(ip)) throw new Error('RATE_LIMITED')

        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user) return null

        const match = await compare(parsed.data.password, user.passwordHash)
        if (!match) return null

        // Vérification du statut
        if (user.status === 'EXPIRED') throw new Error('ACCOUNT_EXPIRED')
        if (user.status === 'SUSPENDED') throw new Error('ACCOUNT_SUSPENDED')

        clearRateLimit(ip)

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          status: user.status,
          trialExpiresAt: user.trialExpiresAt?.toISOString() ?? null,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.companyId = (user as any).companyId
        token.status = (user as any).status
        token.trialExpiresAt = (user as any).trialExpiresAt ?? null
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.companyId = token.companyId as string
        session.user.status = token.status as string
        session.user.trialExpiresAt = (token.trialExpiresAt as string) ?? null
      }
      return session
    },
  },
}
