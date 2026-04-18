'use client'

import { useState } from 'react'

type Company = {
  id: string; name: string; logoUrl: string | null
  primaryColor: string; secondaryColor: string
  users: { name: string; email: string }[]
}

export default function ParametresClient({ initialCompanies }: { initialCompanies: Company[] }) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies)
  const [editing, setEditing]     = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', primaryColor: '', secondaryColor: '', logoUrl: '' })

  function startEdit(c: Company) {
    setEditing(c.id)
    setForm({
      name:           c.name,
      primaryColor:   c.primaryColor,
      secondaryColor: c.secondaryColor,
      logoUrl:        c.logoUrl ?? '',
    })
    setSaved(null)
  }

  async function handleSave(companyId: string) {
    setSaving(true)
    const r = await fetch(`/api/admin/companies/${companyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action:        'edit',
        name:          form.name,
        primaryColor:  form.primaryColor,
        secondaryColor: form.secondaryColor,
        logoUrl:       form.logoUrl || null,
      }),
    })
    setSaving(false)
    if (r.ok) {
      setSaved(companyId)
      setEditing(null)
      const r2 = await fetch('/api/admin/companies')
      if (r2.ok) setCompanies(await r2.json())
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Paramètres sociétés</h1>
        <p className="text-sm text-gray-400 mt-1">Modifiez le nom, les couleurs et le logo de chaque société cliente</p>
      </div>

      {companies.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">Aucune société</p>
      ) : (
        <div className="space-y-4">
          {companies.map(c => (
            <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: c.primaryColor }}>
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.users[0]?.email ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {saved === c.id && (
                    <span className="text-xs text-emerald-400">Sauvegardé ✓</span>
                  )}
                  {editing !== c.id && (
                    <button
                      onClick={() => startEdit(c)}
                      className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg transition-colors"
                    >
                      Modifier
                    </button>
                  )}
                </div>
              </div>

              {/* Formulaire d'édition */}
              {editing === c.id && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Nom de la société</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">URL du logo (optionnel)</label>
                    <input
                      value={form.logoUrl}
                      onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Couleur principale</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color" value={form.primaryColor}
                        onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                        className="w-10 h-9 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        value={form.primaryColor}
                        onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Couleur secondaire</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color" value={form.secondaryColor}
                        onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))}
                        className="w-10 h-9 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        value={form.secondaryColor}
                        onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex gap-3">
                    <button
                      onClick={() => handleSave(c.id)} disabled={saving}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
