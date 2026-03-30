'use client'

import { useEffect, useState } from 'react'
import { AgentCard } from './agent-card'
import { CreateAgentModal } from './create-agent-modal'
import { PromoteAgentModal } from './promote-agent-modal'

export function AgentLibrary() {
  const [agents, setAgents] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'anon' | 'brain-bound' | 'system'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [promoteAgent, setPromoteAgent] = useState<any>(null)

  async function loadAgents() {
    try {
      const res = await fetch('/api/agents')
      setAgents(await res.json())
    } catch {}
  }

  useEffect(() => { loadAgents() }, [])

  const filtered = agents.filter(a => {
    if (filter === 'all') return true
    if (filter === 'system') return a.tags?.includes('system')
    return a.mode === filter && !a.tags?.includes('system')
  })

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {(['all', 'anon', 'brain-bound', 'system'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}>
              {f === 'all' ? 'All' : f === 'brain-bound' ? 'Brain-Bound' : f === 'system' ? 'System' : 'Anon'}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          + Create Agent
        </button>
      </div>

      {/* Agent Grid */}
      {filtered.length === 0 ? (
        <div className="card-padded text-center py-12">
          <p className="text-ink-3">No agents found. Create your first agent to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(agent => (
            <AgentCard key={agent.id} agent={agent}
              onPromote={() => setPromoteAgent(agent)}
              onArchive={async () => {
                await fetch(`/api/agents/${agent.slug}`, { method: 'DELETE' })
                loadAgents()
              }}
              onDuplicate={async () => {
                await fetch(`/api/agents/${agent.slug}/duplicate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: `${agent.name} (copy)` }),
                })
                loadAgents()
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateAgentModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadAgents() }}
        />
      )}
      {promoteAgent && (
        <PromoteAgentModal
          agent={promoteAgent}
          onClose={() => setPromoteAgent(null)}
          onPromoted={() => { setPromoteAgent(null); loadAgents() }}
        />
      )}
    </div>
  )
}
