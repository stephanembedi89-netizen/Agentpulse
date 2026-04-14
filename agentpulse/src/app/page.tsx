import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-brand-700 mb-3">AgentPulse</h1>
        <p className="text-gray-600 mb-8">
          Gérez vos clients, polices et renouvellements depuis un seul endroit.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="btn-primary">
            Se connecter
          </Link>
          <Link href="/register" className="btn-secondary">
            Créer un compte
          </Link>
        </div>
      </div>
    </main>
  )
}
