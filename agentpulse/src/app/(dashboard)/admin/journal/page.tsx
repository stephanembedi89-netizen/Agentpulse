import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Journal système — Super Admin' }

export default async function JournalPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERADMIN') redirect('/login')

  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user:    { select: { name: true, role: true, company: { select: { name: true } } } },
      prospect: { select: { firstName: true, lastName: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Journal système</h1>
        <p className="text-sm text-gray-400 mt-1">100 dernières activités sur toutes les sociétés</p>
      </div>

      <div className="space-y-2">
        {activities.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-12">Aucune activité enregistrée</p>
        )}
        {activities.map(a => (
          <div key={a.id} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex gap-4 items-start">
            <span className="text-gray-500 text-xs whitespace-nowrap pt-0.5">
              {new Date(a.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">{a.note}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {a.user?.name} ({a.user?.company?.name}) ·{' '}
                {a.prospect ? `${a.prospect.firstName} ${a.prospect.lastName}` : '—'}
              </p>
            </div>
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">{a.type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
