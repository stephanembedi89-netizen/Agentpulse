'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const ROLES = [
  { key: 'AGENT', label: 'Agent', color: 'bg-blue-600 hover:bg-blue-500', ring: 'ring-blue-400' },
  { key: 'SUPERVISOR', label: 'Superviseur', color: 'bg-emerald-600 hover:bg-emerald-500', ring: 'ring-emerald-400' },
  { key: 'MANAGER', label: 'Manager', color: 'bg-violet-600 hover:bg-violet-500', ring: 'ring-violet-400' },
  { key: 'SUPERADMIN', label: 'Admin', color: 'bg-orange-600 hover:bg-orange-500', ring: 'ring-orange-400' },
] as const

const DASHBOARDS: Record<string, string> = {
  AGENT: '/agent',
  SUPERVISOR: '/supervisor',
  MANAGER: '/manager',
  SUPERADMIN: '/admin',
}

export default function LoginForm() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const result = await signIn('credentials', { email, password, redirect: false })

    setLoading(false)

    if (!result?.ok) {
      if (result?.error === 'RATE_LIMITED') {
        setError('Trop de tentatives. Réessayez dans 15 minutes.')
        return
      }
      if (result?.error === 'ACCOUNT_EXPIRED') {
        router.push('/pricing')
        return
      }
      if (result?.error === 'ACCOUNT_SUSPENDED') {
        setError('Compte suspendu. Contactez votre manager.')
        return
      }
      setError('Email ou mot de passe incorrect.')
      return
    }

    // Récupérer le rôle réel depuis la session
    const session = await fetch('/api/auth/session').then((r) => r.json())
    const role = session?.user?.role as string
    router.push(DASHBOARDS[role] ?? '/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
            <span className="text-white font-bold text-lg">AP</span>
          </div>
          <h1 className="text-2xl font-bold text-white">AgentPulse</h1>
          <p className="text-gray-400 text-sm mt-1">Connectez-vous à votre espace</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 shadow-2xl">
          {/* Sélecteur de rôle */}
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Votre rôle
          </p>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {ROLES.map(({ key, label, color, ring }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedRole(key)}
                className={`
                  ${color} text-white text-xs font-semibold py-2.5 px-1 rounded-lg
                  transition-all duration-150 ring-offset-2 ring-offset-gray-900
                  ${selectedRole === key ? `ring-2 ${ring} scale-105` : 'opacity-70'}
                `}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="vous@exemple.cm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          AgentPulse © {new Date().getFullYear()} — Cameroun
        </p>
      </div>
    </div>
  )
}
