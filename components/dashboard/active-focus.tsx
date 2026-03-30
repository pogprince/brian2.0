'use client'

import { useEffect, useState } from 'react'

export function ActiveFocus() {
  const [focus, setFocus] = useState('')
  const [priorities, setPriorities] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/flow')
        const flow = await res.json()
        setFocus(flow.active_focus || '')
        setPriorities(flow.priority_stack || [])
      } catch {}
    }
    load()
  }, [])

  return (
    <div className="card-padded">
      <h3 className="section-title mb-3">Active Focus</h3>
      <p className="text-sm text-ink-1 mb-4 leading-relaxed">{focus || 'No active focus set.'}</p>
      {priorities.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-3 uppercase tracking-wider mb-2">Priority Stack</p>
          <div className="space-y-2">
            {priorities.slice(0, 5).map((p: any, i: number) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-brain-100 text-brain-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="text-sm text-ink-1 flex-1">{p.title}</span>
                <span className="text-xs text-ink-3 font-mono">{(p.score || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
