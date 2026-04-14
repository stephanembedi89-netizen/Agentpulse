import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Créer un compte — AgentPulse' }

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Créer un compte</h1>
        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet
            </label>
            <input id="name" name="name" type="text" autoComplete="name" required className="input-field" />
          </div>
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
            <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input-field" />
          </div>
          <div>
            <label htmlFor="agencyName" className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l&apos;agence <span className="text-gray-400">(optionnel)</span>
            </label>
            <input id="agencyName" name="agencyName" type="text" className="input-field" />
          </div>
          <button type="submit" className="btn-primary w-full">
            Créer mon compte
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-brand-600 hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
