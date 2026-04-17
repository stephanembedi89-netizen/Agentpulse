import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Alertes — Super Admin' }

export default async function AlertesAdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPERADMIN') redirect('/login')

  const now      = new Date()
  const in7days  = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const in3days  = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const [expiringSoon, expiredManagers, suspended, noActivity] = await Promise.all([
    // Essais expirant dans 7 jours
    prisma.user.findMany({
      where: { role: 'MANAGER', status: 'TRIAL', trialExpiresAt: { gte: now, lte: in7days } },
      include: { company: { select: { name: true } } },
      orderBy: { trialExpiresAt: 'asc' },
    }),
    // Essais expirés non convertis
    prisma.user.findMany({
      where: { role: 'MANAGER', status: 'EXPIRED' },
      include: { company: { select: { name: true } } },
      orderBy: { trialExpiresAt: 'desc' },
      take: 20,
    }),
    // Comptes suspendus
    prisma.user.findMany({
      where: { role: 'MANAGER', status: 'SUSPENDED' },
      include: { company: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    }),
    // Sociétés sans activité depuis 7+ jours
    prisma.company.findMany({
      where: {
        users: { some: { role: 'MANAGER', status: { in: ['TRIAL', 'ACTIVE'] } } },
        prospects: { none: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } },
      },
      select: { id: true, name: true, createdAt: true, _count: { select: { prospects: true } } },
      take: 20,
    }),
  ])

  const urgent  = expiringSoon.filter(u => u.trialExpiresAt && u.trialExpiresAt <= in3days)
  const warning = expiringSoon.filter(u => u.trialExpiresAt && u.trialExpiresAt > in3days)
  const total   = urgent.length + warning.length + expiredManagers.length + suspended.length + noActivity.length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Alertes</h1>
          <p className="text-sm text-gray-400 mt-1">
            {total === 0 ? 'Aucune alerte active' : `${total} alerte${total > 1 ? 's' : ''} à traiter`}
          </p>
        </div>
        {total > 0 && (
          <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/20 rounded-full text-sm font-bold">
            {total}
          </span>
        )}
      </div>

      {total === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">✓</p>
          <p>Tout est en ordre</p>
        </div>
      )}

      {/* URGENT — expire dans 3 jours */}
      {urgent.length > 0 && (
        <Section title="Expirent dans moins de 3 jours" color="red" count={urgent.length}>
          {urgent.map(u => (
            <AlertRow key={u.id}
              company={u.company.name} contact={u.name} email={u.email}
              detail={`Expire le ${new Date(u.trialExpiresAt!).toLocaleDateString('fr-FR')}`}
              action={{ label: 'Gérer', href: '/admin/abonnements' }}
              color="red"
            />
          ))}
        </Section>
      )}

      {/* AVERTISSEMENT — expire dans 7 jours */}
      {warning.length > 0 && (
        <Section title="Expirent dans 4–7 jours" color="amber" count={warning.length}>
          {warning.map(u => (
            <AlertRow key={u.id}
              company={u.company.name} contact={u.name} email={u.email}
              detail={`Expire le ${new Date(u.trialExpiresAt!).toLocaleDateString('fr-FR')}`}
              action={{ label: 'Gérer', href: '/admin/abonnements' }}
              color="amber"
            />
          ))}
        </Section>
      )}

      {/* EXPIRÉS */}
      {expiredManagers.length > 0 && (
        <Section title="Essais expirés sans conversion" color="gray" count={expiredManagers.length}>
          {expiredManagers.map(u => (
            <AlertRow key={u.id}
              company={u.company.name} contact={u.name} email={u.email}
              detail={`Expiré le ${u.trialExpiresAt ? new Date(u.trialExpiresAt).toLocaleDateString('fr-FR') : '—'}`}
              action={{ label: 'Activer', href: '/admin/abonnements' }}
              color="gray"
            />
          ))}
        </Section>
      )}

      {/* SUSPENDUS */}
      {suspended.length > 0 && (
        <Section title="Comptes suspendus" color="red" count={suspended.length}>
          {suspended.map(u => (
            <AlertRow key={u.id}
              company={u.company.name} contact={u.name} email={u.email}
              detail="Accès bloqué"
              action={{ label: 'Réactiver', href: '/admin/abonnements' }}
              color="red"
            />
          ))}
        </Section>
      )}

      {/* INACTIFS */}
      {noActivity.length > 0 && (
        <Section title="Aucune activité depuis 7+ jours" color="amber" count={noActivity.length}>
          {noActivity.map(c => (
            <AlertRow key={c.id}
              company={c.name} contact="" email=""
              detail={`${c._count.prospects} prospects au total · Depuis le ${new Date(c.createdAt).toLocaleDateString('fr-FR')}`}
              action={{ label: 'Voir', href: '/admin/societes' }}
              color="amber"
            />
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, color, count, children }: {
  title: string; color: string; count: number; children: React.ReactNode
}) {
  const border = color === 'red' ? 'border-red-500/20' : color === 'amber' ? 'border-amber-500/20' : 'border-white/10'
  const text   = color === 'red' ? 'text-red-400' : color === 'amber' ? 'text-amber-400' : 'text-gray-400'
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className={`text-sm font-semibold ${text}`}>{title}</h2>
        <span className={`text-xs px-1.5 py-0.5 rounded border ${border} ${text}`}>{count}</span>
      </div>
      <div className={`space-y-2 border-l-2 ${border} pl-4`}>{children}</div>
    </div>
  )
}

function AlertRow({ company, contact, email, detail, action, color }: {
  company: string; contact: string; email: string; detail: string
  action: { label: string; href: string }; color: string
}) {
  const btnColor = color === 'red'
    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
    : color === 'amber'
      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
      : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/10'
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{company}</p>
        {contact && <p className="text-xs text-gray-400">{contact} · {email}</p>}
        <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
      </div>
      <a href={action.href} className={`shrink-0 text-xs px-3 py-1.5 border rounded-lg transition-colors ${btnColor}`}>
        {action.label}
      </a>
    </div>
  )
}
