import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Mes Ratios — AgentPulse' }

const STAGES     = ['CONTACT', 'ENTRETIEN', 'ENTREVUE', 'SOUMISE', 'EMISE', 'LIVRAISON'] as const
const STEP_LABELS = ['Contact → Entretien', 'Entretien → Entrevue', 'Entrevue → Soumise', 'Soumise → Émise', 'Émise → Livrée']
const TARGETS     = [40, 60, 70, 65, 85]
const STAGE_LABELS: Record<string, string> = {
  CONTACT: 'Contacts', ENTRETIEN: 'Entretiens', ENTREVUE: 'Entrevues',
  SOUMISE: 'Soumises', EMISE: 'Émises', LIVRAISON: 'Livrées',
}

function computeRatios(prospects: { stage: string; estimatedPrime?: number | null }[]) {
  const total    = prospects.length
  const pipeline = Object.fromEntries(STAGES.map(s => [s, prospects.filter(p => p.stage === s).length]))
  const atStage  = STAGES.map((_, i) => prospects.filter(p => STAGES.indexOf(p.stage as typeof STAGES[number]) >= i).length)
  const conv     = STEP_LABELS.map((_, i) => atStage[i] > 0 ? Math.round((atStage[i + 1] / atStage[i]) * 100) : 0)
  const tauxGlobal = total > 0 ? Math.round((pipeline['LIVRAISON'] / total) * 100) : 0
  return { total, pipeline, atStage, conv, tauxGlobal }
}

export default async function SupervisorRatiosPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const supervisorId = session.user.id
  const companyId    = session.user.companyId
  const now          = new Date()

  const [myProspects, agents] = await Promise.all([
    prisma.prospect.findMany({
      where: { agentId: supervisorId, companyId },
      select: { stage: true, estimatedPrime: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { supervisorId, companyId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const agentIds = agents.map(a => a.id)

  const teamProspects = agentIds.length > 0
    ? await prisma.prospect.findMany({
        where: { agentId: { in: agentIds }, companyId },
        select: { agentId: true, stage: true, estimatedPrime: true },
      })
    : []

  const months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }), start: d, end: new Date(d.getFullYear(), d.getMonth() + 1, 1) }
  }).reverse()

  const myStats      = computeRatios(myProspects)
  const myTotalPrime = myProspects.filter(p => p.stage === 'LIVRAISON').reduce((s, p) => s + (p.estimatedPrime ?? 0), 0)
  const monthlyStats = months.map(m => {
    const mp = myProspects.filter(p => p.createdAt >= m.start && p.createdAt < m.end)
    const ml = mp.filter(p => p.stage === 'LIVRAISON').length
    return { label: m.label, contacts: mp.length, livraisons: ml, rate: mp.length > 0 ? Math.round((ml / mp.length) * 100) : 0 }
  })

  const teamStats = agents.map(agent => {
    const ap = teamProspects.filter(p => p.agentId === agent.id)
    return { ...agent, ...computeRatios(ap) }
  })

  return (
    <div className="space-y-10">
      {/* ── Mes ratios personnels ── */}
      <section className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Mes Ratios</h1>
          <p className="text-sm text-gray-400 mt-1">Votre performance personnelle — {myStats.total} prospect{myStats.total > 1 ? 's' : ''}</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Taux global',    value: `${myStats.tauxGlobal}%`,  sub: `${myStats.pipeline['LIVRAISON']} / ${myStats.total}`, color: myStats.tauxGlobal >= 20 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Taux terrain',   value: `${myStats.conv[0]}%`,     sub: 'Contact → Entretien',   color: myStats.conv[0] >= TARGETS[0] ? 'text-emerald-400' : 'text-amber-400' },
            { label: 'Taux closing',   value: `${myStats.conv[3]}%`,     sub: 'Soumise → Émise',       color: myStats.conv[3] >= TARGETS[3] ? 'text-emerald-400' : 'text-amber-400' },
            { label: 'Primes livrées', value: myTotalPrime.toLocaleString('fr-FR'), sub: 'FCFA total', color: 'text-blue-400' },
          ].map(k => (
            <div key={k.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-400">{k.label}</p>
              <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Entonnoir */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Mon entonnoir</h2>
          <div className="space-y-2">
            {STAGES.map((stage, i) => {
              const count = myStats.atStage[i]
              const pct   = myStats.total > 0 ? Math.round((count / myStats.total) * 100) : 0
              const barW  = myStats.total > 0 ? Math.round((myStats.pipeline[stage] / myStats.total) * 100) : 0
              const rate  = i < myStats.conv.length ? myStats.conv[i] : null
              const target = i < TARGETS.length ? TARGETS[i] : null
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-20 text-right shrink-0">{STAGE_LABELS[stage]}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden relative">
                    <div className="h-full rounded-full transition-all" style={{ width: `${barW}%`, backgroundColor: 'var(--brand-primary)', opacity: 0.7 }} />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {myStats.pipeline[stage]} ({pct}%)
                    </span>
                  </div>
                  {rate !== null && target !== null && (
                    <span className={`text-xs w-16 text-right shrink-0 font-medium ${rate >= target ? 'text-emerald-400' : 'text-red-400'}`}>↓ {rate}%</span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-600 mt-3">↓ = taux de conversion vers l'étape suivante</p>
        </div>

        {/* Taux vs cibles */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Conversion étape par étape</h2>
          <div className="space-y-3">
            {STEP_LABELS.map((label, i) => {
              const rate   = myStats.conv[i]
              const target = TARGETS[i]
              const ok     = rate >= target
              return (
                <div key={label} className="flex items-center gap-4">
                  <span className="text-xs text-gray-400 w-40 shrink-0">{label}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(rate, 100)}%` }} />
                  </div>
                  <span className={`text-sm font-bold w-10 text-right shrink-0 ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{rate}%</span>
                  <span className="text-xs text-gray-600 w-10 shrink-0">/ {target}%</span>
                  <span className="text-xs">{ok ? '✓' : '✗'}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Historique mensuel */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Historique mensuel</h2>
          <div className="grid grid-cols-3 gap-3">
            {monthlyStats.map(m => (
              <div key={m.label} className="bg-white/5 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 capitalize">{m.label}</p>
                <p className="text-xl font-bold text-white mt-1">{m.contacts}</p>
                <p className="text-xs text-gray-500">contacts</p>
                <p className="text-sm font-semibold text-emerald-400 mt-2">{m.livraisons} livrées</p>
                <p className="text-xs text-gray-500">{m.rate}% conversion</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ratios équipe ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Ratios de mon équipe</h2>
          <p className="text-sm text-gray-400 mt-1">{agents.length} agent{agents.length > 1 ? 's' : ''} — cliquez sur un nom pour le détail complet</p>
        </div>

        {agents.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-500 text-sm">
            Aucun agent dans votre équipe
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400 text-xs">
                  <th className="px-4 py-3 font-medium">Agent</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Terrain</th>
                  <th className="px-4 py-3 font-medium">Closing</th>
                  <th className="px-4 py-3 font-medium">Livraison</th>
                  <th className="px-4 py-3 font-medium">Global</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {teamStats.map(a => (
                  <tr key={a.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/supervisor/agents/${a.id}`} className="font-medium text-white hover:underline">
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{a.total}</td>
                    <RatioCell value={a.conv[0]} target={TARGETS[0]} />
                    <RatioCell value={a.conv[3]} target={TARGETS[3]} />
                    <RatioCell value={a.conv[4]} target={TARGETS[4]} />
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${a.tauxGlobal >= 20 ? 'bg-emerald-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(a.tauxGlobal, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${a.tauxGlobal >= 20 ? 'text-emerald-400' : 'text-red-400'}`}>{a.tauxGlobal}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Ligne superviseur */}
                <tr className="border-t-2 border-white/20 bg-white/[0.03]">
                  <td className="px-4 py-3 font-semibold text-white">Moi (superviseur)</td>
                  <td className="px-4 py-3 text-gray-300">{myStats.total}</td>
                  <RatioCell value={myStats.conv[0]} target={TARGETS[0]} />
                  <RatioCell value={myStats.conv[3]} target={TARGETS[3]} />
                  <RatioCell value={myStats.conv[4]} target={TARGETS[4]} />
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${myStats.tauxGlobal >= 20 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(myStats.tauxGlobal, 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${myStats.tauxGlobal >= 20 ? 'text-emerald-400' : 'text-red-400'}`}>{myStats.tauxGlobal}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-gray-600">Terrain = Contact→Entretien · Closing = Soumise→Émise · Livraison = Émise→Livrée</p>
      </section>
    </div>
  )
}

function RatioCell({ value, target }: { value: number; target: number }) {
  const ok = value >= target
  return (
    <td className="px-4 py-3">
      <span className={`text-sm font-semibold ${ok ? 'text-emerald-400' : value === 0 ? 'text-gray-600' : 'text-amber-400'}`}>
        {value}%
      </span>
    </td>
  )
}
