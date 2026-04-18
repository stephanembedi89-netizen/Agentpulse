import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
})

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

function sanitizeHex(color: string, fallback: string): string {
  return HEX_RE.test(color) ? color : fallback
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const trialExpiresAt = session.user.trialExpiresAt
    ? new Date(session.user.trialExpiresAt)
    : null

  const daysLeft = trialExpiresAt
    ? Math.ceil((trialExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  // Thème white-label
  const company = await prisma.company.findUnique({
    where:  { id: session.user.companyId },
    select: { logoUrl: true, primaryColor: true, secondaryColor: true },
  })

  const primary   = sanitizeHex(company?.primaryColor   ?? '', '#3B82F6')
  const secondary = sanitizeHex(company?.secondaryColor ?? '', '#10B981')
  const logoUrl   = company?.logoUrl ?? null

  const cssVars = `
    :root {
      --brand-primary:     ${primary};
      --brand-primary-rgb: ${hexToRgb(primary)};
      --brand-secondary:   ${secondary};
    }
  `

  return (
    <div className={`${jakarta.variable} font-[family-name:var(--font-jakarta)] flex h-screen bg-[#080F1D] overflow-hidden`}>
      {/* Injection des variables CSS white-label */}
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />

      <Sidebar role={session.user.role} logoUrl={logoUrl} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          name={session.user.name ?? ''}
          role={session.user.role}
          status={session.user.status}
          daysLeft={daysLeft}
          logoUrl={logoUrl}
        />
        <main className="flex-1 overflow-y-auto p-6 text-white">
          {children}
        </main>
      </div>
    </div>
  )
}
