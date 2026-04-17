import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Mes Ratios — AgentPulse' }

const STAGES = ['CONTACT', 'ENTRETIEN', 'ENTREVUE', 'SOUMISE', 'EMISE', 'LIVRAISON'] as const
const STAGE_LABELS: Record<string, string> = {
  CONTACT: 'Contacts', ENTRETIEN: 'Entretiens', ENTREVUE: 'Entrevues',
  SOUMISE: 'Soumises', EMISE: 'Émises', LIVRAISON: 'Livrées',
}
const STEP_LABELS = ['Contact → Entretien', 'Entretien → Entrevue', 'Entrevue → Soumise', 'Soumise → Émise', 'Émise → Livrée']
const TARGETS     = [40, 60, 70, 65, 85]

type Coaching = { stage: string; message: string; color: string }

function getCoaching(rates: number[]): Coaching[] {
  const advice: Coaching[] = []
  if (rates[0] < TARGETS[0]) advice.push({
    stage: 'Contact → Entretien',
    message: `Votre taux terrain est de ${rates[0]}% (cible: ${TARGETS[0]}%). Augmentez vos sorties terrain et diversifiez vos sources de contacts (réseaux, recommandations clients).`,
    color: 'text-red-400 border-red-500/20 bg-red-500/5',
  })
  if (rates[1] < TARGETS[1]) advice.push({
    stage: 'Entretien → Entrevue',
    message: `Votre taux de qualification est de ${rates[1]}% (cible: ${TARGETS[1]}%). Travaillez mieux la découverte des besoins lors de l'entretien pour avancer plus vite vers l'entrevue.`,
    color: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
  })
  if (rates[2] < TARGETS[2]) advice.push({
    stage: 'Entrevue → Soumise',
    message: `Votre taux de proposition est de ${rates[2]}% (cible: ${TARGETS[2]}%). Préparez mieux vos propositions personnalisées avant l'entrevue.`,
    color: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
  })
  if (rates[3] < TARGETS[3]) advice.push({
    stage: 'Soumise → Émise',
    message: `Votre taux de closing est de ${rates[3]}% (cible: ${TARGETS[3]}%). Réduisez le délai de relance après soumission — rappel dans les 48h.`,
    color: 'text-red-400 border-red-500/20 bg-red-500/5',
  })
  if (rates[4] < TARGETS[4]) advice.push({
    stage: 'Émise → Livrée',
    message: `Votre taux de livraison est de ${rates[4]}% (cible: ${TARGETS[4]}%). Planifiez la remise du contrat dès la validation — ne laissez pas traîner les dossiers émis.`,
    color: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
  })
  return advice
}

export default async function RatiosPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const agentId   = session.user.id
  const companyId = session.user.companyId
  const now       = new Date()

  const prospects = await prisma.prospect.findMany({
    where: { agentId, companyId },
    select: { stage: true, estimatedPrime: true, createdAt: true, updatedAt: true },
  })

  // Pipeline global
  const pipeline = Object.fromEntries(STAGES.map(s => [s, prospects.filter(p => p.stage === s).length]))
  const total    = prospects.length

  // Cumulative counts (at-or-beyond each stage)
  const atStage = STAGES.map((_, i) => prospects.filter(p => STAGES.indexOf(p.stage as typeof STAGES[number]) >= i).length)

  // Conversion rates between consecutive stages
  const conversionRates = STEP_LABELS.map((_, i) =>
    atStage[i] > 0 ? Math.round((atStage[i + 1] / atStage[i]) * 100) : 0
  )

  const tauxGlobal = total > 0 ? Math.round((pipeline['LIVRAISON'] / total) * 100) : 0

  // Monthly breakdown (last 3 months)
  const months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      start: d,
      end:   new Date(d.getFullYear(), d.getMonth() + 1, 1),
    }
  }).reverse()

  const monthlyStats = months.map(m => {
    const mProspects = prospects.filter(p => p.createdAt >= m.start && p.createdAt < m.end)
    const mLivraisons = mProspects.filter(p => p.stage === 'LIVRAISON').length
    const mRate = mProspects.length > 0 ? Math.round((mLivraisons / mProspects.length) * 100) : 0
    return { label: m.label, contacts: mProspects.length, livraisons: mLivraisons, rate: mRate }
  })

  const coaching   = getCoaching(conversionRates)
  const totalPrime = prospects
    .filter(p => p.stage === 'LIVRAISON')
    .reduce((s, p) => s + (p.estimatedPrime ?? 0), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Mes Ratios</h1>
        <p className="text-sm text-gray-400 mt-1">Analyse de votre entonnoir de conversion — {total} prospect{total > 1 ? 's' : ''} au total</p>
      </div>

      {/* KPIs synthèse */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Taux global', value: `${tauxGlobal}%`, sub: `${pipeline['LIVRAISON']} / ${total}`, color: tauxGlobal >= 20 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Taux terrain', value: `${conversionRates[0]}%`, sub: 'Contact → Entretien', color: conversionRates[0] >= TARGETS[0] ? 'text-emerald-400' : 'text-amber-400' },
          { label: 'Taux closing', value: `${conversionRates[3]}%`, sub: 'Soumise → Émise', color: conversionRates[3] >= TARGETS[3] ? 'text-emerald-400' : 'text-amber-400' },
          { label: 'Primes livrées', value: totalPrime.toLocaleString('fr-FR'), sub: 'FCFA total', color: 'text-blue-400' },
        ].map(k => (
          <div key={k.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-gray-400">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Entonnoir visuel */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-5">Entonnoir de conversion</h2>
        <div className="space-y-2">
          {STAGES.map((stage, i) => {
            const count   = atStage[i]
            const pct     = total > 0 ? Math.round((count / total) * 100) : 0
            const rate    = i < conversionRates.length ? conversionRates[i] : null
            const target  = i < TARGETS.length ? TARGETS[i] : null
            const barW    = total > 0 ? Math.round((pipeline[stage] / total) * 100) : 0
            return (
              <div key={stage}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs text-gray-400 w-20 text-right shrink-0">{STAGE_LABELS[stage]}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${barW}%`, backgroundColor: 'var(--brand-primary)', opacity: 0.7 }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {pipeline[stage]} ({pct}%)
                    </span>
                  </div>
                  {rate !== null && target !== null && (
                    <span className={`text-xs w-16 text-right shrink-0 font-medium ${rate >= target ? 'text-emerald-400' : 'text-red-400'}`}>
                      ↓ {rate}%
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-600 mt-3">↓ = taux de conversion vers l'étape suivante</p>
      </div>

      {/* Taux étape par étape vs cibles */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Conversion étape par étape</h2>
        <div className="space-y-3">
          {STEP_LABELS.map((label, i) => {
            const rate   = conversionRates[i]
            const target = TARGETS[i]
            const ok     = rate >= target
            return (
              <div key={label} className="flex items-center gap-4">
                <span className="text-xs text-gray-400 w-40 shrink-0">{label}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${ok ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(rate, 100)}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-bold w-10 text-right ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{rate}%</span>
                  <span className="text-xs text-gray-600">/ {target}%</span>
                  <span className="text-xs">{ok ? '✓' : '✗'}</span>
                </div>
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

      {/* Coaching */}
      {coaching.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Points d'amélioration</h2>
          {coaching.map(c => (
            <div key={c.stage} className={`border rounded-xl p-4 ${c.color}`}>
              <p className="text-xs font-semibold mb-1">{c.stage}</p>
              <p className="text-sm">{c.message}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 text-center text-emerald-400">
          <p className="font-semibold">Tous vos ratios sont au-dessus des cibles</p>
          <p className="text-sm mt-1 text-emerald-500">Excellent travail — continuez ainsi !</p>
        </div>
      )}
    </div>
  )
}
