import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'

type Role = 'SUPERADMIN' | 'MANAGER' | 'SUPERVISOR' | 'AGENT'
type Handler = (req: Request, session: Session) => Promise<Response>

/**
 * Wrapper RBAC pour les routes API App Router.
 *
 * Usage :
 *   export const GET = withRole(['MANAGER', 'SUPERADMIN'])(async (req, session) => {
 *     const data = await prisma.policy.findMany({
 *       where: { companyId: session.user.companyId }, // ← companyId du JWT
 *     })
 *     return Response.json(data)
 *   })
 */
export function withRole(allowedRoles: Role[]) {
  return function (handler: Handler) {
    return async function (req: Request): Promise<Response> {
      const session = await getServerSession(authOptions)

      if (!session) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
      }

      if (!allowedRoles.includes(session.user.role as Role)) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
      }

      return handler(req, session)
    }
  }
}
