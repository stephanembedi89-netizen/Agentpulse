import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Mon Équipe — AgentPulse' }

export default async function SupervisorAgentsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const agents = await prisma.user.findMany({
    where:   { supervisorId: session.user.id, companyId: session.user.companyId },
    select:  { id: true, name: true, email: true, phone: true, createdAt: true },
    orderBy: { name: 'asc' },
  })

  if (agents.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold text-white mb-6">Mon Équipe</h1>
        <div className="text-center text-white/30 py-16 text-sm rounded-xl border border-white/10">
          Aucun agent dans votre équipe
        </div>
      </div>
    )
  }

  const agentIds = agents.map(a => a.id)

  const allProspects = await prisma.prospect.findMany({
    where:  { agentId: { in: agentIds }, companyId: session.user.companyId },
    select: { agentId: true, stage: true },
  })

  const agentStats = agents.map(agent => {
    const prospects = allProspects.filter(p => p.agentId === agent.id)
    const total      = prospects.length
    const contacts   = total
    const entrevues  = prospects.filter(p =>
      ['ENTREVUE','SOUMISE','EMISE','LIVRAISON'].includes(p.stage)
    ).length
    const polices    = prospects.filter(p => ['EMISE','LIVRAISON'].includes(p.stage)).length
    const livraisons = prospects.filter(p => p.stage === 'LIVRAISON').length
    const tauxGlobal = total > 0 ? Math.round((livraisons / total) * 100) : 0
    return { ...agent, total, contacts, entrevues, polices, tauxGlobal }
  })

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">
        Mon Équipe
        <span className="ml-2 text-sm font-normal text-white/40">{agents.length} agent{agents.length > 1 ? 's' : ''}</span>
      </h1>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              {['Agent', 'Contacts', 'Entrevues', 'Polices', 'Taux global'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agentStats.map(a => (
              <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{a.name}</p>
                    <p className="text-xs text-white/30">{a.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-blue-400 font-semibold">{a.contacts}</td>
                <td className="px-4 py-3 text-violet-400 font-semibold">{a.entrevues}</td>
                <td className="px-4 py-3 text-emerald-400 font-semibold">{a.polices}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 max-w-24">
                      <div
                        className={`h-full rounded-full ${a.tauxGlobal >= 20 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(a.tauxGlobal, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${a.tauxGlobal >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {a.tauxGlobal} %
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
