import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Classement — AgentPulse' }

const MEDALS = ['🥇', '🥈', '🥉']

export default async function ClassementPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const companyId  = session.user.companyId
  const now        = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const agents = await prisma.user.findMany({
    where:   { companyId, role: 'AGENT', status: 'ACTIVE' },
    select: {
      id: true, name: true,
      supervisor: { select: { name: true } },
      policies: {
        where:  { status: { in: ['EMISE', 'LIVREE'] } },
        select: { premium: true, createdAt: true },
      },
      prospects: {
        select: { id: true, createdAt: true },
      },
    },
  })

  const ranked = agents
    .map(a => {
      const policesTotal   = a.policies.length
      const policesMois    = a.policies.filter(p => p.createdAt >= startMonth).length
      const primesTotales  = a.policies.reduce((s, p) => s + (p.premium ?? 0), 0)
      const contactsMois   = a.prospects.filter(p => p.createdAt >= startMonth).length
      const taux           = a.prospects.length > 0
        ? Math.round((policesTotal / a.prospects.length) * 100)
        : 0
      return {
        id: a.id,
        name: a.name,
        supervisor: a.supervisor?.name ?? '—',
        policesMois,
        policesTotal,
        contactsMois,
        primesTotales,
        taux,
      }
    })
    .sort((a, b) => b.policesTotal - a.policesTotal)

  const maxPolices = Math.max(...ranked.map(a => a.policesTotal), 1)

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-white">Classement des agents</h1>

      {ranked.length === 0 ? (
        <div className="text-center text-white/30 py-16 text-sm rounded-xl border border-white/10">
          Aucun agent actif
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ranked.map((a, i) => (
            <div
              key={a.id}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4"
            >
              {/* Rank */}
              <span className="text-2xl w-8 text-center flex-shrink-0">
                {i < 3 ? MEDALS[i] : <span className="text-white/30 text-sm font-bold">#{i + 1}</span>}
              </span>

              {/* Name + supervisor */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{a.name}</p>
                <p className="text-xs text-white/30 mt-0.5">Superviseur : {a.supervisor}</p>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden w-full max-w-xs">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all"
                    style={{ width: `${Math.round((a.policesTotal / maxPolices) * 100)}%` }}
                  />
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 flex-shrink-0 text-right">
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wide">Polices</p>
                  <p className="text-white font-bold">{a.policesTotal}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wide">Ce mois</p>
                  <p className="text-blue-400 font-bold">{a.policesMois}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wide">Taux</p>
                  <p className="text-emerald-400 font-bold">{a.taux}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wide">Primes</p>
                  <p className="text-amber-400 font-bold text-xs">{a.primesTotales.toLocaleString('fr-FR')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
