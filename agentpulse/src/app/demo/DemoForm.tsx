'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const POSTES = ['Directeur', 'Manager', 'Superviseur', 'Responsable commercial', 'Gérant', 'Autre']

const EMPTY = { firstName: '', lastName: '', company: '', role: '', email: '', phone: '' }

export default function DemoForm() {
  const router  = useRouter()
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [done, setDone]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/demo', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error ?? 'Erreur'); return }
      setDone(true)
      setTimeout(() => router.push('/login'), 4000)
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-white font-bold text-lg mb-2">Compte créé !</h2>
        <p className="text-white/50 text-sm">
          Vos identifiants ont été envoyés à <strong className="text-white">{form.email}</strong>.<br />
          Redirection vers la connexion…
        </p>
      </div>
    )
  }

  function f(field: keyof typeof EMPTY) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">

      {error && (
        <div className="bg-red-950/60 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prénom *">
          <input type="text" required value={form.firstName} onChange={f('firstName')}
            className={input} placeholder="Jean" />
        </Field>
        <Field label="Nom *">
          <input type="text" required value={form.lastName} onChange={f('lastName')}
            className={input} placeholder="Dupont" />
        </Field>
      </div>

      <Field label="Nom de la société *">
        <input type="text" required value={form.company} onChange={f('company')}
          className={input} placeholder="Allianz Cameroun" />
      </Field>

      <Field label="Votre poste *">
        <select required value={form.role} onChange={f('role')} className={input}>
          <option value="" disabled>Sélectionner votre poste</option>
          {POSTES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </Field>

      <Field label="Email professionnel *">
        <input type="email" required value={form.email} onChange={f('email')}
          className={input} placeholder="jean@allianz.cm" />
      </Field>

      <Field label="Téléphone *">
        <input type="tel" required value={form.phone} onChange={f('phone')}
          className={input} placeholder="+237 6XX XXX XXX" />
      </Field>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 mt-1"
      >
        {saving ? 'Création du compte…' : 'Démarrer mon essai gratuit →'}
      </button>

      <p className="text-center text-white/20 text-xs">
        En continuant, vous acceptez nos{' '}
        <a href="/cgv" className="underline hover:text-white/40">conditions générales</a>.
      </p>
    </form>
  )
}

const input = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
