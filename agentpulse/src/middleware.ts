import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const DASHBOARDS: Record<string, string> = {
  AGENT: '/agent',
  SUPERVISOR: '/supervisor',
  MANAGER: '/manager',
  SUPERADMIN: '/admin',
}

// Rôles autorisés par section
const ALLOWED: Record<string, string[]> = {
  '/agent': ['AGENT', 'SUPERADMIN'],
  '/supervisor': ['SUPERVISOR', 'SUPERADMIN'],
  '/manager': ['MANAGER', 'SUPERADMIN'],
  '/admin': ['SUPERADMIN'],
}

function getDashboard(role?: string): string {
  return DASHBOARDS[role ?? ''] ?? '/login'
}

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role as string | undefined
    const pathname = req.nextUrl.pathname

    const section = Object.keys(ALLOWED).find((s) => pathname.startsWith(s))
    if (section && role && !ALLOWED[section].includes(role)) {
      return NextResponse.redirect(new URL(getDashboard(role), req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/agent/:path*', '/supervisor/:path*', '/manager/:path*', '/admin/:path*'],
}
