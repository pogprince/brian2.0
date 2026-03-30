'use client'

import { clsx } from 'clsx'
import Link from 'next/link'

interface AgentCardProps {
  agent: any
  onPromote: () => void
  onArchive: () => void
  onDuplicate: () => void
}

export function AgentCard({ agent, onPromote, onArchive, onDuplicate }: AgentCardProps) {
  const isSystem = agent.tags?.includes('system')
  const modeBadge = isSystem ? 'badge-system' : agent.mode === 'brain-bound' ? 'badge-brain-bound' : 'badge-anon'
  const modeLabel = isSystem ? 'System' : agent.mode === 'brain-bound' ? 'Brain-Bound' : 'Anon'

  return (
    <div className="card-padded flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-ink-0 truncate">{agent.name}</h3>
          <span className={clsx(modeBadge, 'mt-1')}>{modeLabel}</span>
        </div>
        {agent.status === 'archived' && <span className="badge-archived">Archived</span>}
      </div>
      <p className="text-xs text-ink-2 mb-3 line-clamp-2 flex-1">{agent.description}</p>

      {agent.linked_projects?.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-ink-3 uppercase tracking-wider mb-1">Projects</p>
          <div className="flex flex-wrap gap-1">
            {agent.linked_projects.map((p: string) => (
              <span key={p} className="badge bg-surface-2 text-ink-2">{p}</span>
            ))}
          </div>
        </div>
      )}

      {agent.tags?.length > 0 && !isSystem && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {agent.tags.filter((t: string) => t !== 'system').map((t: string) => (
              <span key={t} className="text-[10px] text-ink-3 bg-surface-2 px-1.5 py-0.5 rounded">{t}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-surface-3">
        <Link href={`/runner?agent=${agent.slug}`} className="btn-primary btn-sm flex-1 text-center">Run</Link>
        {agent.mode === 'anon' && !isSystem && (
          <button className="btn-secondary btn-sm" onClick={onPromote}>Promote</button>
        )}
        <button className="btn-ghost btn-sm" onClick={onDuplicate} title="Duplicate">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        {!isSystem && (
          <button className="btn-ghost btn-sm text-status-error" onClick={onArchive} title="Archive">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        )}
      </div>
    </div>
  )
}
