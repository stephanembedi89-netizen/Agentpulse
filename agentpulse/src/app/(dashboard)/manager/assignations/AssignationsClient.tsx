'use client'

import { useState } from 'react'

interface Agent {
  id: string
  name: string
  email: string
  supervisorId: string | null
}

interface Supervisor {
  id: string
  name: string
}

export default function AssignationsClient({
  initialAgents,
  supervisors,
}: {
  initialAgents: Agent[]
  supervisors: Supervisor[]
}) {
  const [agents, setAgents]   = useState<Agent[]>(initialAgents)
  const [loading, setLoading] = useState<string | null>(null)
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function assign(agentId: string, supervisorId: string | null) {
    setLoading(agentId)
    const prev = [...agents]
    setAgents(list =>
      list.map(a => a.id === agentId ? { ...a, supervisorId } : a)
    )
    try {
      const res = await fetch(`/api/users/${agentId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ supervisorId }),
      })
      if (!res.ok) {
        setAgents(prev)
        const j = await res.json()
        showToast(j.error ?? 'Erreur', false)
      } else {
        showToast('Assignation mise à jour', true)
      }
    } catch {
      setAgents(prev)
      showToast('Erreur réseau', false)
    } finally {
      setLoading(null)
    }
  }

  const unassigned = agents.filter(a => !a.supervisorId)

  return (
    <div className="flex flex-col gap-6">

      {toast && (
        <div className={`fixed top-4 right-4 z-50 border text-sm px-4 py-3 rounded-xl shadow-xl ${
          toast.ok
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/80 border-red-500/40 text-red-300'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Assignations</h1>
          <p className="text-xs text-white/30 mt-0.5">Affectez chaque agent à un superviseur</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/30">
          <span>{agents.length} agent{agents.length > 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{supervisors.length} superviseur{supervisors.length > 1 ? 's' : ''}</span>
          {unassigned.length > 0 && (
            <>
              <span>·</span>
              <span className="text-amber-400 font-semibold">{unassigned.length} non assigné{unassigned.length > 1 ? 's' : ''}</span>
            </>
          )}
        </div>
      </div>

      {/* Agents sans superviseur */}
      {unassigned.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">
            Agents sans superviseur ({unassigned.length})
          </p>
          <div className="flex flex-col gap-2">
            {unassigned.map(a => (
              <AgentRow
                key={a.id}
                agent={a}
                supervisors={supervisors}
                loading={loading === a.id}
                onAssign={supId => assign(a.id, supId || null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Par superviseur */}
      <div className="flex flex-col gap-4">
        {supervisors.map(sup => {
          const team = agents.filter(a => a.supervisorId === sup.id)
          return (
            <div key={sup.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-bold">{sup.name}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {team.length} agent{team.length > 1 ? 's' : ''} dans l&apos;équipe
                  </p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  team.length === 0
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {team.length === 0 ? 'Aucun agent' : `${team.length} agent${team.length > 1 ? 's' : ''}`}
                </span>
              </div>

              {team.length === 0 ? (
                <p className="text-xs text-white/20 italic">Aucun agent assigné à ce superviseur</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {team.map(a => (
                    <AgentRow
                      key={a.id}
                      agent={a}
                      supervisors={supervisors}
                      loading={loading === a.id}
                      onAssign={supId => assign(a.id, supId || null)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {supervisors.length === 0 && (
        <div className="text-center text-white/30 py-16 text-sm rounded-xl border border-white/10">
          Aucun superviseur — créez d&apos;abord un superviseur dans Utilisateurs
        </div>
      )}
    </div>
  )
}

function AgentRow({
  agent, supervisors, loading, onAssign,
}: {
  agent: Agent
  supervisors: Supervisor[]
  loading: boolean
  onAssign: (supId: string) => void
}) {
  return (
    <div className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5">
      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs font-bold flex-shrink-0">
        {agent.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{agent.name}</p>
        <p className="text-xs text-white/30 truncate">{agent.email}</p>
      </div>
      <select
        value={agent.supervisorId ?? ''}
        onChange={e => onAssign(e.target.value)}
        disabled={loading}
        className="border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-opacity"
        style={{ backgroundColor: '#0D1626', color: 'white', minWidth: '160px' }}
      >
        <option value="" style={{ backgroundColor: '#0D1626', color: '#9ca3af' }}>— Sans superviseur —</option>
        {supervisors.map(s => (
          <option key={s.id} value={s.id} style={{ backgroundColor: '#0D1626', color: 'white' }}>
            {s.name}
          </option>
        ))}
      </select>
      {loading && <span className="text-xs text-white/30 animate-pulse">…</span>}
    </div>
  )
}
