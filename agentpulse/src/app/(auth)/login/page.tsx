import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Connexion — AgentPulse' }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Connexion</h1>
        <form className="space-y-4" action="/api/auth/callback/credentials" method="POST">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required className="input-field" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="input-field" />
          </div>
          <button type="submit" className="btn-primary w-full">
            Se connecter
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-brand-600 hover:underline font-medium">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}
