'use client'

import { useEffect, useState } from 'react'

export function RecommendedActions() {
  const [actions, setActions] = useState<string[]>([])
  const [blockers, setBlockers] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/flow')
        const flow = await res.json()
        setActions(flow.recommended_actions || [])
        setBlockers(flow.blockers || [])
      } catch {}
    }
    load()
  }, [])

  return (
    <div className="card-padded">
      <h3 className="section-title mb-3">Recommended Actions</h3>
      {blockers.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-status-error uppercase tracking-wider mb-2">Blockers</p>
          {blockers.map((b: any) => (
            <div key={b.id} className="flex items-start gap-2 mb-2 p-2 bg-red-50 rounded-lg border border-red-100">
              <span className="text-status-error mt-0.5 font-bold">!</span>
              <div>
                <p className="text-sm font-medium text-ink-0">{b.title}</p>
                <p className="text-xs text-ink-2">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {actions.map((action, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-1 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-brain-400 flex-shrink-0" />
            <span className="text-sm text-ink-1">{action}</span>
          </div>
        ))}
        {actions.length === 0 && <p className="text-sm text-ink-3 italic">No recommended actions right now.</p>}
      </div>
    </div>
  )
}
