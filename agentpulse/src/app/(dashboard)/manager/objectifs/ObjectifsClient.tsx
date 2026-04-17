'use client'

import { useState, useEffect } from 'react'

interface Objectifs {
  contactsMois:   number
  policiesMois:   number
  primeCible:     number
  tauxCommission: number
}

const DEFAULTS: Objectifs = { contactsMois: 40, policiesMois: 10, primeCible: 500000, tauxCommission: 5 }

export default function ObjectifsClient() {
  const [form, setForm]     = useState<Objectifs>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/company/objectives')
      .then(r => r.json())
      .then(d => { if (d) setForm(d) })
      .finally(() => setLoaded(true))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const r = await fetch('/api/company/objectives', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  if (!loaded) return <p className="text-gray-500 text-sm">Chargement...</p>

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Objectifs mensuels</h1>
          <p className="text-xs text-gray-500 mt-1">Partagés avec toute l'équipe — sauvegardés en base de données</p>
        </div>
        {saved && <span className="text-xs text-emerald-400 font-semibold">✓ Enregistré</span>}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-4">
          <Field label="Contacts à générer par mois">
            <input
              type="number" min="0" value={form.contactsMois}
              onChange={e => setForm(f => ({ ...f, contactsMois: Number(e.target.value) }))}
              className="input-base" placeholder="ex: 40"
            />
          </Field>
          <Field label="Polices à émettre par mois">
            <input
              type="number" min="0" value={form.policiesMois}
              onChange={e => setForm(f => ({ ...f, policiesMois: Number(e.target.value) }))}
              className="input-base" placeholder="ex: 10"
            />
          </Field>
          <Field label="Prime mensuelle cible (FCFA)">
            <input
              type="number" min="0" value={form.primeCible}
              onChange={e => setForm(f => ({ ...f, primeCible: Number(e.target.value) }))}
              className="input-base" placeholder="ex: 500000"
            />
          </Field>
          <Field label="Taux de commission cible (%)">
            <input
              type="number" min="0" max="100" step="0.1" value={form.tauxCommission}
              onChange={e => setForm(f => ({ ...f, tauxCommission: Number(e.target.value) }))}
              className="input-base" placeholder="ex: 5"
            />
          </Field>
        </div>

        {/* Aperçu */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3">Aperçu</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wide">Contacts / mois</p>
              <p className="text-white font-bold text-xl mt-0.5">{form.contactsMois.toLocaleString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wide">Polices / mois</p>
              <p className="text-violet-400 font-bold text-xl mt-0.5">{form.policiesMois.toLocaleString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wide">Prime cible</p>
              <p className="text-amber-400 font-bold text-xl mt-0.5">{form.primeCible.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wide">Taux commission</p>
              <p className="text-emerald-400 font-bold text-xl mt-0.5">{form.tauxCommission}%</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => setForm(DEFAULTS)}
            className="px-4 py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Réinitialiser
          </button>
          <button
            type="submit" disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .input-base {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
        }
        .input-base::placeholder { color: rgba(255,255,255,0.2); }
        .input-base:focus { border-color: rgb(59,130,246); }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
