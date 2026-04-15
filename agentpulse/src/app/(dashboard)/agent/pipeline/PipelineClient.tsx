'use client'

import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
type ProspectStage = 'CONTACT' | 'ENTRETIEN' | 'ENTREVUE' | 'SOUMISE' | 'EMISE' | 'LIVRAISON'

interface Prospect {
  id: string
  firstName: string
  lastName: string
  job: string | null
  estimatedPrime: number | null
  phone: string
  stage: ProspectStage
  createdAt: string
}

interface JournalEntry {
  id: string
  prospectName: string
  from: ProspectStage
  to: ProspectStage
  at: Date
}

interface FormState {
  firstName: string
  lastName: string
  phone: string
  job: string
  estimatedPrime: string
}

// ─── Config colonnes ──────────────────────────────────────────────────────────
const STAGES: {
  key: ProspectStage
  label: string
  color: string
  headerBg: string
  colBg: string
}[] = [
  { key: 'CONTACT',   label: 'Contact',        color: 'text-blue-400',    headerBg: 'border-blue-500/30',   colBg: 'bg-blue-500/5 border-blue-500/15' },
  { key: 'ENTRETIEN', label: 'Entretien',      color: 'text-cyan-400',    headerBg: 'border-cyan-500/30',   colBg: 'bg-cyan-500/5 border-cyan-500/15' },
  { key: 'ENTREVUE',  label: 'Entrevue',       color: 'text-violet-400',  headerBg: 'border-violet-500/30', colBg: 'bg-violet-500/5 border-violet-500/15' },
  { key: 'SOUMISE',   label: 'Police soumise', color: 'text-amber-400',   headerBg: 'border-amber-500/30',  colBg: 'bg-amber-500/5 border-amber-500/15' },
  { key: 'EMISE',     label: 'Police émise',   color: 'text-emerald-400', headerBg: 'border-emerald-500/30',colBg: 'bg-emerald-500/5 border-emerald-500/15' },
  { key: 'LIVRAISON', label: 'Livraison',      color: 'text-orange-400',  headerBg: 'border-orange-500/30', colBg: 'bg-orange-500/5 border-orange-500/15' },
]

const STAGE_INDEX: Record<ProspectStage, number> = {
  CONTACT: 0, ENTRETIEN: 1, ENTREVUE: 2, SOUMISE: 3, EMISE: 4, LIVRAISON: 5,
}

const NEXT_STAGE: Record<ProspectStage, ProspectStage | null> = {
  CONTACT: 'ENTRETIEN', ENTRETIEN: 'ENTREVUE', ENTREVUE: 'SOUMISE',
  SOUMISE: 'EMISE', EMISE: 'LIVRAISON', LIVRAISON: null,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatFcfa(n: number | null) {
  if (n == null || n === 0) return '—'
  return n.toLocaleString('fr-FR') + ' FCFA'
}

function formatDateTime(d: Date) {
  return (
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) +
    ' · ' +
    d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  )
}

const EMPTY_FORM: FormState = { firstName: '', lastName: '', phone: '', job: '', estimatedPrime: '' }

// ─── Composant principal ──────────────────────────────────────────────────────
export default function PipelineClient({ initialProspects }: { initialProspects: Prospect[] }) {
  const [prospects, setProspects]   = useState<Prospect[]>(initialProspects)
  const [journal, setJournal]       = useState<JournalEntry[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [loadingId, setLoadingId]   = useState<string | null>(null)
  const [showModal, setShowModal]   = useState(false)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState<string | null>(null)

  // Groupement par étape
  const byStage = STAGES.reduce<Record<ProspectStage, Prospect[]>>(
    (acc, s) => { acc[s.key] = prospects.filter(p => p.stage === s.key); return acc },
    {} as Record<ProspectStage, Prospect[]>
  )

  // ─── KPIs ────────────────────────────────────────────────────────────────
  const total      = prospects.length
  const emises     = prospects.filter(p => p.stage === 'EMISE' || p.stage === 'LIVRAISON').length
  const livres     = prospects.filter(p => p.stage === 'LIVRAISON').length
  const tauxConv   = total ? Math.round((livres / total) * 100) : 0
  const caPotentiel = prospects.reduce((s, p) => s + (p.estimatedPrime ?? 0), 0)
  const caReel      = prospects.filter(p => p.stage === 'LIVRAISON').reduce((s, p) => s + (p.estimatedPrime ?? 0), 0)

  function showError(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  // ─── Avancer étape ───────────────────────────────────────────────────────
  async function advance(prospect: Prospect) {
    const next = NEXT_STAGE[prospect.stage]
    if (!next || loadingId) return
    setLoadingId(prospect.id)
    try {
      const res = await fetch(`/api/prospects/${prospect.id}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: next }),
      })
      if (!res.ok) {
        const j = await res.json()
        showError(j.error ?? 'Erreur lors du déplacement')
        return
      }
      setProspects(prev =>
        prev.map(p => p.id === prospect.id ? { ...p, stage: next } : p)
      )
      setJournal(prev => [{
        id: `${Date.now()}`,
        prospectName: `${prospect.firstName} ${prospect.lastName}`,
        from: prospect.stage,
        to: next,
        at: new Date(),
      }, ...prev])
    } finally {
      setLoadingId(null)
    }
  }

  // ─── Retirer prospect ────────────────────────────────────────────────────
  async function remove(prospect: Prospect) {
    if (!confirm(`Retirer ${prospect.firstName} ${prospect.lastName} du pipeline ?`)) return
    setLoadingId(prospect.id)
    try {
      await fetch(`/api/prospects/${prospect.id}`, { method: 'DELETE' })
      setProspects(prev => prev.filter(p => p.id !== prospect.id))
    } finally {
      setLoadingId(null)
    }
  }

  // ─── Drag & drop ─────────────────────────────────────────────────────────
  function onDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  async function onDrop(e: React.DragEvent, targetStage: ProspectStage) {
    e.preventDefault()
    if (!draggingId) return
    const prospect = prospects.find(p => p.id === draggingId)
    setDraggingId(null)
    if (!prospect || prospect.stage === targetStage) return
    const toIdx = STAGE_INDEX[targetStage]
    const fromIdx = STAGE_INDEX[prospect.stage]
    if (toIdx !== fromIdx + 1) {
      showError("Déplacement impossible : avancez d'une étape à la fois")
      return
    }
    await advance(prospect)
  }

  // ─── Créer prospect ──────────────────────────────────────────────────────
  async function createProspect(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        phone:     form.phone.trim(),
        job:       form.job.trim() || null,
        estimatedPrime: form.estimatedPrime ? parseFloat(form.estimatedPrime) : null,
      }
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json()
        showError(j.error ?? 'Erreur lors de la création')
        return
      }
      const created: Prospect = await res.json()
      setProspects(prev => [created, ...prev])
      setShowModal(false)
      setForm(EMPTY_FORM)
    } finally {
      setSaving(false)
    }
  }

  // ─── Rendu ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 h-full">

      {/* Toast erreur */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-red-950/80 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl shadow-xl">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-red-400 hover:text-red-200 leading-none">✕</button>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Pipeline Prospect</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau Contact
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 flex-none">
        <KpiCard label="Total contacts"  value={String(total)}      color="text-blue-400" />
        <KpiCard label="Polices émises"  value={String(emises)}     color="text-emerald-400" />
        <KpiCard label="Taux conversion" value={`${tauxConv} %`}   color="text-violet-400" />
        <KpiCard label="CA potentiel"    value={formatFcfa(caPotentiel)} color="text-amber-400" />
        <KpiCard label="CA réel"         value={formatFcfa(caReel)} color="text-orange-400" />
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-1 flex-1 min-h-0">
        {STAGES.map(stage => (
          <div
            key={stage.key}
            className={`flex-none w-52 flex flex-col rounded-xl border ${stage.colBg} overflow-hidden`}
            onDragOver={onDragOver}
            onDrop={e => onDrop(e, stage.key)}
          >
            {/* En-tête colonne */}
            <div className={`px-3 py-2.5 border-b border-white/5 flex items-center justify-between`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${stage.color}`}>
                {stage.label}
              </span>
              <span className="text-xs text-white/30 font-mono font-medium">
                {byStage[stage.key].length}
              </span>
            </div>

            {/* Cartes */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 min-h-[4rem]">
              {byStage[stage.key].length === 0 && (
                <div className="flex-1 border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-white/20">—</span>
                </div>
              )}
              {byStage[stage.key].map(p => (
                <ProspectCard
                  key={p.id}
                  prospect={p}
                  stageColor={stage.color}
                  isLast={stage.key === 'LIVRAISON'}
                  isLoading={loadingId === p.id}
                  onAdvance={() => advance(p)}
                  onRemove={() => remove(p)}
                  onDragStart={e => onDragStart(e, p.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Journal des mouvements */}
      {journal.length > 0 && (
        <div className="flex-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">
            Journal des mouvements
          </p>
          <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
            {journal.map(e => (
              <div key={e.id} className="flex items-center gap-2 text-xs">
                <span className="text-white/25 font-mono shrink-0">{formatDateTime(e.at)}</span>
                <span className="font-semibold text-white/70 truncate">{e.prospectName}</span>
                <span className="text-white/25 shrink-0">·</span>
                <span className="text-white/50 shrink-0">
                  {STAGES.find(s => s.key === e.from)?.label}
                </span>
                <span className="text-blue-400 shrink-0">→</span>
                <span className="text-white/70 shrink-0">
                  {STAGES.find(s => s.key === e.to)?.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Nouveau Contact */}
      {showModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-[#0D1626] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-5">Nouveau Contact</h2>
            <form onSubmit={createProspect} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Prénom *"
                  value={form.firstName}
                  onChange={v => setForm(f => ({ ...f, firstName: v }))}
                  required
                />
                <FormField
                  label="Nom *"
                  value={form.lastName}
                  onChange={v => setForm(f => ({ ...f, lastName: v }))}
                  required
                />
              </div>
              <FormField
                label="Téléphone *"
                value={form.phone}
                onChange={v => setForm(f => ({ ...f, phone: v }))}
                required
                type="tel"
              />
              <FormField
                label="Profession"
                value={form.job}
                onChange={v => setForm(f => ({ ...f, job: v }))}
              />
              <FormField
                label="Prime estimée (FCFA)"
                value={form.estimatedPrime}
                onChange={v => setForm(f => ({ ...f, estimatedPrime: v }))}
                type="number"
              />
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm(EMPTY_FORM) }}
                  className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? 'Enregistrement…' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] text-white/40 mb-1 leading-tight">{label}</p>
      <p className={`text-lg font-bold leading-tight ${color}`}>{value}</p>
    </div>
  )
}

function ProspectCard({
  prospect, stageColor, isLast, isLoading, onAdvance, onRemove, onDragStart,
}: {
  prospect: Prospect
  stageColor: string
  isLast: boolean
  isLoading: boolean
  onAdvance: () => void
  onRemove: () => void
  onDragStart: (e: React.DragEvent) => void
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-[#080F1D]/70 border border-white/10 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors"
    >
      <p className="font-semibold text-white text-sm leading-tight">
        {prospect.firstName} {prospect.lastName}
      </p>
      {prospect.job && (
        <p className="text-[11px] text-white/40 mt-0.5 truncate">{prospect.job}</p>
      )}
      <p className={`text-sm font-bold mt-2 ${stageColor}`}>
        {formatFcfa(prospect.estimatedPrime)}
      </p>
      <div className="flex gap-1.5 mt-3">
        {!isLast && (
          <button
            onClick={onAdvance}
            disabled={isLoading}
            className="flex-1 text-[11px] font-semibold bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/20 rounded-md py-1.5 transition-colors disabled:opacity-40"
          >
            {isLoading ? '…' : 'Avancer'}
          </button>
        )}
        <button
          onClick={onRemove}
          disabled={isLoading}
          title="Retirer"
          className="shrink-0 text-[11px] font-semibold bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-40"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function FormField({
  label, value, onChange, required, type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? 'any' : undefined}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      />
    </div>
  )
}
