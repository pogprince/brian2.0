'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'

const statusStyles: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  running: 'bg-blue-100 text-blue-800',
  pending: 'bg-gray-100 text-gray-600',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

export function RunHistory() {
  const [runs, setRuns] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/runs')
        setRuns(await res.json())
      } catch {}
    }
    load()
  }, [])

  const filtered = runs.filter(r =>
    !filter ||
    r.task.toLowerCase().includes(filter.toLowerCase()) ||
    r.agent_name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="flex gap-6">
      {/* Run List */}
      <div className="flex-1">
        <input className="input mb-4" placeholder="Filter runs..." value={filter} onChange={e => setFilter(e.target.value)} />

        {filtered.length === 0 ? (
          <div className="card-padded text-center py-12">
            <p className="text-ink-3">No runs found. Go to the Runner to execute your first task.</p>
          </div>
        ) : (
          <div className="card divide-y divide-surface-3">
            {filtered.map(run => (
              <button key={run.id} onClick={() => setSelected(run)}
                className={clsx(
                  'w-full text-left px-5 py-4 hover:bg-surface-1 transition-colors',
                  selected?.id === run.id && 'bg-brain-50'
                )}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium text-ink-0 truncate">{run.task}</p>
                    <p className="text-xs text-ink-3 mt-1">
                      {run.agent_name} &middot; {run.agent_mode} &middot; {run.model || 'unknown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={clsx('badge', statusStyles[run.status])}>{run.status}</span>
                    {run.duration_ms && <span className="text-xs text-ink-4">{(run.duration_ms / 1000).toFixed(1)}s</span>}
                    <span className="text-xs text-ink-4">{new Date(run.started_at).toLocaleString()}</span>
                  </div>
                </div>
                {run.writeback_suggestions?.length > 0 && (
                  <p className="text-xs text-brain-600 mt-1">{run.writeback_suggestions.length} writeback suggestion(s)</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Run Detail */}
      {selected && (
        <div className="w-96 flex-shrink-0">
          <div className="card-padded sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Run Detail</h3>
              <button className="btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-ink-3 uppercase">Task</p>
                <p className="text-ink-1">{selected.task}</p>
              </div>
              <div>
                <p className="text-xs text-ink-3 uppercase">Agent</p>
                <p className="text-ink-1">{selected.agent_name} ({selected.agent_mode})</p>
              </div>
              <div>
                <p className="text-xs text-ink-3 uppercase">Status</p>
                <span className={clsx('badge', statusStyles[selected.status])}>{selected.status}</span>
              </div>
              <div>
                <p className="text-xs text-ink-3 uppercase">Model</p>
                <p className="text-ink-1 font-mono text-xs">{selected.model} / {selected.provider}</p>
              </div>
              {selected.duration_ms && (
                <div>
                  <p className="text-xs text-ink-3 uppercase">Duration</p>
                  <p className="text-ink-1">{(selected.duration_ms / 1000).toFixed(2)}s</p>
                </div>
              )}
              <div>
                <p className="text-xs text-ink-3 uppercase">Started</p>
                <p className="text-ink-1">{new Date(selected.started_at).toLocaleString()}</p>
              </div>
            </div>

            {selected.output && (
              <div className="mt-4">
                <p className="text-xs text-ink-3 uppercase mb-1">Output</p>
                <pre className="text-xs text-ink-1 whitespace-pre-wrap font-mono bg-surface-1 p-3 rounded-lg max-h-60 overflow-y-auto border border-surface-3">{selected.output}</pre>
              </div>
            )}

            {selected.error && (
              <div className="mt-4">
                <p className="text-xs text-ink-3 uppercase mb-1">Error</p>
                <pre className="text-xs text-status-error bg-red-50 p-3 rounded-lg border border-red-100">{selected.error}</pre>
              </div>
            )}

            {selected.writeback_suggestions?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-ink-3 uppercase mb-1">Writeback Suggestions</p>
                <div className="space-y-2">
                  {selected.writeback_suggestions.map((wb: any) => (
                    <div key={wb.id} className="p-2 bg-brain-50 rounded border border-brain-100">
                      <p className="text-xs font-medium text-brain-700">{wb.type}: {wb.target_module}</p>
                      <p className="text-xs text-ink-2 mt-1">{wb.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
