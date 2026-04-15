import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'

type Role = 'SUPERADMIN' | 'MANAGER' | 'SUPERVISOR' | 'AGENT'
type RouteContext = { params: Record<string, string> }
type Handler = (req: Request, session: Session, ctx: RouteContext) => Promise<Response>

/**
 * Wrapper RBAC pour les routes API App Router.
 *
 * Usage (route statique) :
 *   export const GET = withRole(['AGENT'])(async (req, session) => { ... })
 *
 * Usage (route dynamique) :
 *   export const PUT = withRole(['AGENT'])(async (req, session, ctx) => {
 *     const id = ctx.params.id
 *     ...
 *   })
 */
export function withRole(allowedRoles: Role[]) {
  return function (handler: Handler) {
    return async function (req: Request, ctx: RouteContext = { params: {} }): Promise<Response> {
      const session = await getServerSession(authOptions)

      if (!session) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
      }

      if (!allowedRoles.includes(session.user.role as Role)) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
      }

      return handler(req, session, ctx)
    }
  }
}
