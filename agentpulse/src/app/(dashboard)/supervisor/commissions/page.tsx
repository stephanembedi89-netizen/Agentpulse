import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Mes Commissions — AgentPulse' }

const STATUS_STYLE: Record<string, string> = {
  ATTENTE: 'bg-amber-500/20 text-amber-400',
  VALIDE:  'bg-emerald-500/20 text-emerald-400',
  PAYE:    'bg-blue-500/20 text-blue-400',
}
const STATUS_LABEL: Record<string, string> = {
  ATTENTE: 'En attente', VALIDE: 'Validée', PAYE: 'Payée',
}

export default async function SupervisorCommissionsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const commissions = await prisma.commission.findMany({
    where:   { agentId: session.user.id, companyId: session.user.companyId },
    include: { policy: { select: { policyNumber: true, productType: true } } },
    orderBy: { month: 'desc' },
  })

  const totalPaye = commissions
    .filter(c => c.status === 'PAYE')
    .reduce((s, c) => s + c.amount, 0)

  const totalAttente = commissions
    .filter(c => c.status !== 'PAYE')
    .reduce((s, c) => s + c.amount, 0)

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Mes Commissions</h1>

      {/* Totaux */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs text-white/40 mb-1">Total perçu</p>
          <p className="text-xl font-bold text-emerald-400">{totalPaye.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs text-white/40 mb-1">En attente</p>
          <p className="text-xl font-bold text-amber-400">{totalAttente.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>

      {commissions.length === 0 ? (
        <div className="text-center text-white/30 py-16 text-sm rounded-xl border border-white/10">
          Aucune commission enregistrée
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                {['Mois', 'Police', 'Produit', 'Montant FCFA', 'Taux', 'Statut'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commissions.map(c => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white/60">
                    {new Date(c.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white/60">{c.policy.policyNumber}</td>
                  <td className="px-4 py-3 text-white/60">{c.policy.productType}</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">{c.amount.toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3 text-white/40">{c.rate} %</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${STATUS_STYLE[c.status] ?? 'bg-white/10 text-white/40'}`}>
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
