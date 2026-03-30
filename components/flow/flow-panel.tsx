'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'

export function FlowPanel() {
  const [flow, setFlow] = useState<any>(null)
  const [metaAgents, setMetaAgents] = useState<any[]>([])
  const [editingFocus, setEditingFocus] = useState(false)
  const [focusText, setFocusText] = useState('')

  async function loadFlow() {
    try {
      const [flowRes, maRes] = await Promise.all([
        fetch('/api/flow'),
        fetch('/api/flow/meta-agents'),
      ])
      const flowData = await flowRes.json()
      setFlow(flowData)
      setFocusText(flowData.active_focus || '')
      setMetaAgents(await maRes.json())
    } catch {}
  }

  useEffect(() => { loadFlow() }, [])

  async function saveFocus() {
    await fetch('/api/flow', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active_focus: focusText }),
    })
    setEditingFocus(false)
    loadFlow()
  }

  async function resolveWriteback(id: string, action: 'approve' | 'reject') {
    await fetch('/api/flow/writebacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    loadFlow()
  }

  if (!flow) return <div className="text-ink-3">Loading flow state...</div>

  return (
    <div className="space-y-6">
      {/* Active Focus */}
      <div className="card-padded">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">Active Focus</h3>
          {editingFocus ? (
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm" onClick={() => setEditingFocus(false)}>Cancel</button>
              <button className="btn-primary btn-sm" onClick={saveFocus}>Save</button>
            </div>
          ) : (
            <button className="btn-secondary btn-sm" onClick={() => setEditingFocus(true)}>Edit</button>
          )}
        </div>
        {editingFocus ? (
          <textarea className="textarea h-20" value={focusText} onChange={e => setFocusText(e.target.value)} />
        ) : (
          <p className="text-sm text-ink-1 leading-relaxed">{flow.active_focus}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Stack */}
        <div className="card-padded">
          <h3 className="section-title mb-4">Priority Stack</h3>
          {flow.priority_stack?.length > 0 ? (
            <div className="space-y-3">
              {flow.priority_stack.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-surface-1 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-brain-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-0">{p.title}</p>
                    {p.project && <p className="text-xs text-ink-3">Project: {p.project}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-brain-600">{(p.score || 0).toFixed(2)}</p>
                    <div className="flex gap-1 mt-1">
                      <span className="text-[9px] text-ink-4" title="Urgency">U:{(p.urgency || 0).toFixed(1)}</span>
                      <span className="text-[9px] text-ink-4" title="Blockage">B:{(p.blockage_impact || 0).toFixed(1)}</span>
                      <span className="text-[9px] text-ink-4" title="Goal">G:{(p.goal_proximity || 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-3">No priorities set.</p>
          )}
        </div>

        {/* Blockers */}
        <div className="card-padded">
          <h3 className="section-title mb-4">Blockers</h3>
          {flow.blockers?.length > 0 ? (
            <div className="space-y-3">
              {flow.blockers.map((b: any) => (
                <div key={b.id} className={clsx('p-3 rounded-lg border',
                  b.severity === 'critical' ? 'bg-red-50 border-red-200' :
                  b.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                  'bg-yellow-50 border-yellow-200'
                )}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-0">{b.title}</span>
                    <span className={clsx('badge',
                      b.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      b.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    )}>{b.severity}</span>
                  </div>
                  <p className="text-xs text-ink-2 mt-1">{b.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-center">
              <p className="text-sm text-green-700">No blockers detected</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending Writebacks */}
      <div className="card-padded">
        <h3 className="section-title mb-4">Pending Writebacks</h3>
        {flow.pending_writebacks?.length > 0 ? (
          <div className="space-y-3">
            {flow.pending_writebacks.map((wb: any) => (
              <div key={wb.id} className="flex items-center gap-4 p-3 bg-brain-50 rounded-lg border border-brain-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-brain-bound">{wb.type}</span>
                    <span className="text-xs text-ink-3 font-mono">{wb.target_module}</span>
                  </div>
                  <p className="text-sm text-ink-1">{wb.description}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary btn-sm" onClick={() => resolveWriteback(wb.id, 'approve')}>Approve</button>
                  <button className="btn-secondary btn-sm" onClick={() => resolveWriteback(wb.id, 'reject')}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-3">No pending writebacks.</p>
        )}
      </div>

      {/* Recent Mutations */}
      <div className="card-padded">
        <h3 className="section-title mb-4">Recent Flow Mutations</h3>
        {flow.recent_mutations?.length > 0 ? (
          <div className="space-y-2">
            {flow.recent_mutations.slice(0, 20).map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-surface-3 last:border-0">
                <span className="badge bg-surface-2 text-ink-2">{m.type}</span>
                <span className="text-sm text-ink-1 flex-1">{m.description}</span>
                <span className="text-xs text-ink-4">{m.module}</span>
                <span className="text-xs text-ink-4">{new Date(m.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-3">No recent mutations.</p>
        )}
      </div>

      {/* Meta-Agents */}
      <div className="card-padded">
        <h3 className="section-title mb-4">Flow Meta-Agents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {metaAgents.map((ma: any) => (
            <div key={ma.role} className="p-3 bg-surface-1 rounded-lg border border-surface-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="badge badge-system">{ma.role}</span>
              </div>
              <p className="text-sm font-medium text-ink-0">{ma.name}</p>
              <p className="text-xs text-ink-2 mt-1">{ma.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="card-padded">
        <h3 className="section-title mb-4">Recommended Next Actions</h3>
        <div className="space-y-2">
          {(flow.recommended_actions || []).map((action: string, i: number) => (
            <div key={i} className="flex items-center gap-3 p-2 hover:bg-surface-1 rounded-lg transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-brain-400 flex-shrink-0" />
              <span className="text-sm text-ink-1">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
