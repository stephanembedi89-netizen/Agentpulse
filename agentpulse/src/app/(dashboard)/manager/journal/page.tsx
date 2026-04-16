import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Journal — AgentPulse' }

const TYPE_LABEL: Record<string, string> = {
  CONTACT:      'Contact',
  ENTRETIEN:    'Entretien',
  ENTREVUE:     'Entrevue',
  NOTE:         'Note',
  STAGE_CHANGE: 'Étape',
}
const TYPE_COLOR: Record<string, string> = {
  CONTACT:      'bg-blue-500/20 text-blue-400',
  ENTRETIEN:    'bg-violet-500/20 text-violet-400',
  ENTREVUE:     'bg-purple-500/20 text-purple-400',
  NOTE:         'bg-gray-500/20 text-gray-400',
  STAGE_CHANGE: 'bg-emerald-500/20 text-emerald-400',
}

export default async function JournalPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const companyId = session.user.companyId

  const activities = await prisma.activity.findMany({
    where: { user: { companyId } },
    include: {
      user:     { select: { name: true, role: true } },
      prospect: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Journal d&apos;activité</h1>
        <span className="text-xs text-white/30">50 dernières actions</span>
      </div>

      {activities.length === 0 ? (
        <div className="text-center text-white/30 py-16 text-sm rounded-xl border border-white/10">
          Aucune activité enregistrée
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                {['Date', 'Utilisateur', 'Rôle', 'Type', 'Prospect', 'Note'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.map(a => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{a.user.name}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{a.user.role}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${TYPE_COLOR[a.type] ?? 'bg-white/10 text-white/40'}`}>
                      {TYPE_LABEL[a.type] ?? a.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/60 text-xs">
                    {a.prospect ? `${a.prospect.firstName} ${a.prospect.lastName}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-white/40 max-w-xs truncate text-xs">{a.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
