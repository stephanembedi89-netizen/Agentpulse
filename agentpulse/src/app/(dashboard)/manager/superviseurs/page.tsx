import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Superviseurs — AgentPulse' }

export default async function SuperviseursPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const companyId  = session.user.companyId
  const now        = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const ago2days   = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  const supervisors = await prisma.user.findMany({
    where:  { companyId, role: 'SUPERVISOR', status: 'ACTIVE' },
    select: {
      id: true, name: true, email: true,
      // Activité perso (ses propres polices)
      policies: {
        where:  { status: { in: ['EMISE', 'LIVREE'] } },
        select: { premium: true, createdAt: true },
      },
      prospects: { select: { id: true, createdAt: true } },
      // Son équipe
      agents: {
        where:  { status: 'ACTIVE' },
        select: {
          id: true, name: true,
          policies: {
            where:  { status: { in: ['EMISE', 'LIVREE'] } },
            select: { premium: true, createdAt: true },
          },
          prospects:  { select: { id: true, createdAt: true } },
          activities: {
            orderBy: { createdAt: 'desc' },
            take:    1,
            select:  { createdAt: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const built = supervisors.map(s => {
    // Perso
    const persoPolices  = s.policies.length
    const persoMois     = s.policies.filter(p => p.createdAt >= startMonth).length
    const persoContacts = s.prospects.filter(p => p.createdAt >= startMonth).length
    const persoTaux     = s.prospects.length > 0
      ? Math.round((persoPolices / s.prospects.length) * 100) : 0

    // Équipe
    const teamPolices  = s.agents.reduce((sum, a) => sum + a.policies.length, 0)
    const teamMois     = s.agents.reduce((sum, a) => sum + a.policies.filter(p => p.createdAt >= startMonth).length, 0)
    const teamContacts = s.agents.reduce((sum, a) => sum + a.prospects.filter(p => p.createdAt >= startMonth).length, 0)
    const teamProsp    = s.agents.reduce((sum, a) => sum + a.prospects.length, 0)
    const teamTaux     = teamProsp > 0 ? Math.round((teamPolices / teamProsp) * 100) : 0
    const teamPrimes   = s.agents.reduce(
      (sum, a) => sum + a.policies.reduce((s2, p) => s2 + (p.premium ?? 0), 0), 0
    )
    const inactiveAgents = s.agents.filter(a => {
      const last = a.activities[0]?.createdAt
      return !last || last < ago2days
    }).length

    return {
      id: s.id, name: s.name, email: s.email,
      nbAgents: s.agents.length,
      perso: { polices: persoPolices, mois: persoMois, contacts: persoContacts, taux: persoTaux },
      team:  { polices: teamPolices,  mois: teamMois,  contacts: teamContacts, taux: teamTaux, primes: teamPrimes, inactives: inactiveAgents },
    }
  })

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-white">Superviseurs</h1>

      {built.length === 0 ? (
        <div className="text-center text-white/30 py-16 text-sm rounded-xl border border-white/10">
          Aucun superviseur actif
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {built.map(s => (
            <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-bold text-base">{s.name}</p>
                  <p className="text-xs text-white/30">{s.email} · {s.nbAgents} agent{s.nbAgents > 1 ? 's' : ''}</p>
                </div>
                {s.team.inactives > 0 && (
                  <span className="text-[11px] bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md font-semibold">
                    {s.team.inactives} inactif{s.team.inactives > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Colonne gauche : activité perso */}
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-violet-400 mb-3">Activité personnelle</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="Polices" value={s.perso.polices} />
                    <Stat label="Ce mois" value={s.perso.mois} />
                    <Stat label="Contacts" value={s.perso.contacts} />
                    <Stat label="Taux" value={`${s.perso.taux}%`} />
                  </div>
                </div>

                {/* Colonne droite : stats équipe */}
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-3">Stats équipe</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="Polices" value={s.team.polices} />
                    <Stat label="Ce mois" value={s.team.mois} />
                    <Stat label="Contacts" value={s.team.contacts} />
                    <Stat label="Taux" value={`${s.team.taux}%`} />
                    <div className="col-span-2">
                      <Stat label="Primes équipe" value={s.team.primes.toLocaleString('fr-FR') + ' FCFA'} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] text-white/30 uppercase tracking-wide">{label}</p>
      <p className="text-white font-semibold text-sm mt-0.5">{value}</p>
    </div>
  )
}
