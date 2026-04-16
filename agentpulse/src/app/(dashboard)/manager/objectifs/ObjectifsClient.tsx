'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'agentpulse_objectifs'

interface Objectifs {
  contactsMois:    string
  policesMois:     string
  primeMois:       string
  tauxCommission:  string
}

const DEFAULTS: Objectifs = {
  contactsMois:   '',
  policesMois:    '',
  primeMois:      '',
  tauxCommission: '',
}

export default function ObjectifsClient() {
  const [form, setForm]     = useState<Objectifs>(DEFAULTS)
  const [saved, setSaved]   = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setForm(JSON.parse(raw))
    } catch { /* ignore */ }
    setLoaded(true)
  }, [])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY)
    setForm(DEFAULTS)
  }

  if (!loaded) return null

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Objectifs mensuels</h1>
        {saved && (
          <span className="text-xs text-emerald-400 font-semibold animate-pulse">
            ✓ Enregistré
          </span>
        )}
      </div>

      <div className="text-xs text-white/30 -mt-2">
        Ces objectifs sont stockés localement sur cet appareil.
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-4">

          <Field label="Contacts à générer par mois">
            <input
              type="number" min="0" value={form.contactsMois}
              onChange={e => setForm(f => ({ ...f, contactsMois: e.target.value }))}
              className="input-base" placeholder="ex: 40"
            />
          </Field>

          <Field label="Polices à émettre par mois">
            <input
              type="number" min="0" value={form.policesMois}
              onChange={e => setForm(f => ({ ...f, policesMois: e.target.value }))}
              className="input-base" placeholder="ex: 10"
            />
          </Field>

          <Field label="Prime mensuelle cible (FCFA)">
            <input
              type="number" min="0" value={form.primeMois}
              onChange={e => setForm(f => ({ ...f, primeMois: e.target.value }))}
              className="input-base" placeholder="ex: 500000"
            />
          </Field>

          <Field label="Taux de commission cible (%)">
            <input
              type="number" min="0" max="100" step="0.1" value={form.tauxCommission}
              onChange={e => setForm(f => ({ ...f, tauxCommission: e.target.value }))}
              className="input-base" placeholder="ex: 15"
            />
          </Field>
        </div>

        {/* Preview */}
        {(form.contactsMois || form.policesMois) && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3">Aperçu objectifs</p>
            <div className="grid grid-cols-2 gap-4">
              {form.contactsMois && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wide">Contacts / mois</p>
                  <p className="text-white font-bold text-xl mt-0.5">{parseInt(form.contactsMois).toLocaleString('fr-FR')}</p>
                </div>
              )}
              {form.policesMois && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wide">Polices / mois</p>
                  <p className="text-violet-400 font-bold text-xl mt-0.5">{parseInt(form.policesMois).toLocaleString('fr-FR')}</p>
                </div>
              )}
              {form.primeMois && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wide">Prime cible</p>
                  <p className="text-amber-400 font-bold text-xl mt-0.5">{parseInt(form.primeMois).toLocaleString('fr-FR')} FCFA</p>
                </div>
              )}
              {form.tauxCommission && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wide">Taux commission</p>
                  <p className="text-emerald-400 font-bold text-xl mt-0.5">{form.tauxCommission}%</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Enregistrer
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
