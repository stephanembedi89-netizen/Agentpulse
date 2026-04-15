import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
})

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const trialExpiresAt = session.user.trialExpiresAt
    ? new Date(session.user.trialExpiresAt)
    : null

  const daysLeft = trialExpiresAt
    ? Math.ceil((trialExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className={`${jakarta.variable} font-[family-name:var(--font-jakarta)] flex h-screen bg-[#080F1D] overflow-hidden`}>
      <Sidebar role={session.user.role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          name={session.user.name ?? ''}
          role={session.user.role}
          status={session.user.status}
          daysLeft={daysLeft}
        />
        <main className="flex-1 overflow-y-auto p-6 text-white">
          {children}
        </main>
      </div>
    </div>
  )
}
