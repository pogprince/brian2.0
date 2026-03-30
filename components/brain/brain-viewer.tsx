'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { ModuleEditor } from './module-editor'

interface BrainModule {
  path: string
  meta: {
    title?: string
    type?: string
    salience?: number
    volatility?: string
    last_updated?: string
    related_agents?: string[]
  }
  content: string
  raw: string
}

function getCategory(path: string): string {
  if (path.startsWith('core/')) return 'Core'
  if (path.startsWith('projects/')) return 'Projects'
  if (path.startsWith('archive/')) return 'Archive'
  if (path.startsWith('generated/')) return 'Generated'
  return 'Other'
}

function volatilityColor(v?: string): string {
  if (v === 'low') return 'text-status-success'
  if (v === 'medium') return 'text-status-warning'
  if (v === 'high') return 'text-status-error'
  return 'text-ink-4'
}

export function BrainViewer() {
  const [modules, setModules] = useState<BrainModule[]>([])
  const [selected, setSelected] = useState<BrainModule | null>(null)
  const [filter, setFilter] = useState('')

  async function loadModules() {
    try {
      const res = await fetch('/api/brain')
      setModules(await res.json())
    } catch {}
  }

  useEffect(() => { loadModules() }, [])

  const filtered = modules.filter(m =>
    !filter || m.path.toLowerCase().includes(filter.toLowerCase()) ||
    (m.meta.title || '').toLowerCase().includes(filter.toLowerCase())
  )

  const grouped = filtered.reduce<Record<string, BrainModule[]>>((acc, m) => {
    const cat = getCategory(m.path)
    ;(acc[cat] = acc[cat] || []).push(m)
    return acc
  }, {})

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Sidebar - Module Tree */}
      <div className="w-72 flex-shrink-0">
        <input className="input mb-4" placeholder="Filter modules..." value={filter} onChange={e => setFilter(e.target.value)} />

        <div className="space-y-4">
          {Object.entries(grouped).map(([category, mods]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">{category}</p>
              <div className="space-y-1">
                {mods.map(m => (
                  <button key={m.path} onClick={() => setSelected(m)}
                    className={clsx(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                      selected?.path === m.path
                        ? 'bg-brain-50 text-brain-700'
                        : 'text-ink-2 hover:bg-surface-2'
                    )}>
                    <p className="font-medium truncate">{m.meta.title || m.path}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-ink-4 font-mono">{m.path}</span>
                      {m.meta.salience !== undefined && (
                        <span className="text-[10px] text-ink-4">S:{m.meta.salience}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {selected ? (
          <ModuleEditor module={selected} onSaved={() => { loadModules() }} />
        ) : (
          <div className="card-padded flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-ink-3 mb-2">Select a module to view or edit</p>
              <p className="text-xs text-ink-4">{modules.length} modules in your brain</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
