'use client'

import { signOut } from 'next-auth/react'

const ROLE_LABELS: Record<string, string> = {
  AGENT: 'Agent',
  SUPERVISOR: 'Superviseur',
  MANAGER: 'Manager',
  SUPERADMIN: 'Super Admin',
}

const ROLE_COLORS: Record<string, string> = {
  AGENT:      'bg-blue-600/20 text-blue-400 border-blue-500/30',
  SUPERVISOR: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
  MANAGER:    'bg-violet-600/20 text-violet-400 border-violet-500/30',
  SUPERADMIN: 'bg-orange-600/20 text-orange-400 border-orange-500/30',
}

type Props = {
  name: string
  role: string
  status: string
  daysLeft: number | null
}

export default function Topbar({ name, role, status, daysLeft }: Props) {
  const isTrial = status === 'TRIAL'
  const expiringSoon = isTrial && daysLeft !== null && daysLeft <= 3

  return (
    <header className="h-16 shrink-0 bg-[#080F1D] border-b border-white/5 flex items-center justify-between px-6">

      {/* Gauche : titre de page (placeholder) */}
      <div className="flex items-center gap-3">
        {isTrial && daysLeft !== null && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            expiringSoon
              ? 'bg-red-600/20 text-red-400 border-red-500/30'
              : 'bg-amber-600/20 text-amber-400 border-amber-500/30'
          }`}>
            {expiringSoon && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            )}
            {expiringSoon
              ? `Expiration imminente — ${daysLeft}j`
              : `Essai — ${daysLeft}j restant${daysLeft > 1 ? 's' : ''}`
            }
          </div>
        )}
      </div>

      {/* Droite : user info + logout */}
      <div className="flex items-center gap-4">
        {/* Nom + rôle */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white leading-none">{name}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-none">{ROLE_LABELS[role] ?? role}</p>
          </div>
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold ${ROLE_COLORS[role] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
            {name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Déconnexion */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  )
}
