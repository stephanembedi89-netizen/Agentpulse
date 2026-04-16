import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Mes Polices — AgentPulse' }

const STATUS_STYLE: Record<string, string> = {
  SOUMISE: 'bg-amber-500/20 text-amber-400',
  EMISE:   'bg-emerald-500/20 text-emerald-400',
  LIVREE:  'bg-blue-500/20 text-blue-400',
}
const STATUS_LABEL: Record<string, string> = {
  SOUMISE: 'Soumise', EMISE: 'Émise', LIVREE: 'Livrée',
}

export default async function SupervisorPolicesPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const policies = await prisma.policy.findMany({
    where:   { agentId: session.user.id, companyId: session.user.companyId },
    include: { prospect: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Mes Polices</h1>

      {policies.length === 0 ? (
        <div className="text-center text-white/30 py-16 text-sm rounded-xl border border-white/10">
          Aucune police enregistrée
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                {['N° Police', 'Client', 'Produit', 'Prime FCFA', 'Statut', 'Début'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policies.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-white/60">{p.policyNumber}</td>
                  <td className="px-4 py-3 font-medium text-white">
                    {p.prospect.firstName} {p.prospect.lastName}
                  </td>
                  <td className="px-4 py-3 text-white/60">{p.productType}</td>
                  <td className="px-4 py-3 text-amber-400 font-semibold">
                    {p.premium.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${STATUS_STYLE[p.status] ?? 'bg-white/10 text-white/40'}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {new Date(p.startDate).toLocaleDateString('fr-FR')}
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
