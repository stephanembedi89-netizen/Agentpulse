import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'KPIs — AgentPulse' }

const RATIOS = [
  { key: 'contactToEntretien', label: 'Contact → Entretien',    formula: 'Entretiens / Contacts' },
  { key: 'entretienToEntrevue', label: 'Entretien → Entrevue',  formula: 'Entrevues / Entretiens' },
  { key: 'entrevueToSoumise',  label: 'Entrevue → Soumission', formula: 'Soumissions / Entrevues' },
  { key: 'soumiseToEmise',     label: 'Soumission → Émission', formula: 'Émissions / Soumissions' },
  { key: 'emiseToLivree',      label: 'Émission → Livraison',  formula: 'Livrées / Émises' },
  { key: 'global',             label: 'Taux global',           formula: 'Polices actives / Contacts' },
]

interface AgentRatios {
  id: string
  name: string
  contactToEntretien: number
  entretienToEntrevue: number
  entrevueToSoumise: number
  soumiseToEmise: number
  emiseToLivree: number
  global: number
}

export default async function KpisPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const companyId = session.user.companyId

  const agents = await prisma.user.findMany({
    where:  { companyId, role: 'AGENT', status: 'ACTIVE' },
    select: {
      id: true, name: true,
      prospects: {
        select: { stage: true },
      },
      policies: {
        where:  { status: { in: ['EMISE', 'LIVREE'] } },
        select: { status: true },
      },
    },
  })

  const agentRatios: AgentRatios[] = agents.map(a => {
    const stages = a.prospects.map(p => p.stage)
    const count  = (s: string) => stages.filter(x => x === s).length + (s === 'CONTACT' ? a.prospects.length : 0)

    const contacts    = a.prospects.length
    const entretiens  = stages.filter(s => ['ENTRETIEN','ENTREVUE','SOUMISE','EMISE','LIVRAISON'].includes(s)).length
    const entrevues   = stages.filter(s => ['ENTREVUE','SOUMISE','EMISE','LIVRAISON'].includes(s)).length
    const soumises    = stages.filter(s => ['SOUMISE','EMISE','LIVRAISON'].includes(s)).length
    const emises      = a.policies.length
    const livrees     = a.policies.filter(p => p.status === 'LIVREE').length

    const r = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0

    return {
      id:   a.id,
      name: a.name,
      contactToEntretien:  r(entretiens, contacts),
      entretienToEntrevue: r(entrevues,  entretiens),
      entrevueToSoumise:   r(soumises,   entrevues),
      soumiseToEmise:      r(emises,     soumises),
      emiseToLivree:       r(livrees,    emises),
      global:              r(emises,     contacts),
    }
  })

  // Moyennes société
  const avg = (key: keyof AgentRatios) =>
    agentRatios.length > 0
      ? Math.round(agentRatios.reduce((s, a) => s + (a[key] as number), 0) / agentRatios.length)
      : 0

  // Top & bottom per ratio
  const topBottom = (key: keyof AgentRatios) => {
    if (agentRatios.length === 0) return { top: null, bottom: null }
    const sorted = [...agentRatios].sort((a, b) => (b[key] as number) - (a[key] as number))
    return { top: sorted[0], bottom: sorted[sorted.length - 1] }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-white">KPIs & Ratios de transformation</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {RATIOS.map(ratio => {
          const avgVal = avg(ratio.key as keyof AgentRatios)
          const { top, bottom } = topBottom(ratio.key as keyof AgentRatios)

          return (
            <div key={ratio.key} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-1">{ratio.label}</p>
              <p className="text-[10px] text-white/25 mb-3 font-mono">{ratio.formula}</p>

              {/* Average */}
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold text-white">{avgVal}%</span>
                <span className="text-xs text-white/30 mb-1">moyenne société</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${avgVal}%` }}
                />
              </div>

              {/* Top / bottom */}
              {top && (
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400">↑ {top.name}</span>
                    <span className="text-emerald-400 font-semibold">{top[ratio.key as keyof AgentRatios]}%</span>
                  </div>
                  {bottom && bottom.id !== top.id && (
                    <div className="flex items-center justify-between">
                      <span className="text-red-400">↓ {bottom.name}</span>
                      <span className="text-red-400 font-semibold">{bottom[ratio.key as keyof AgentRatios]}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
