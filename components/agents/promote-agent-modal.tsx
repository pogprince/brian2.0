'use client'

import { useEffect, useState } from 'react'

interface Props {
  agent: any
  onClose: () => void
  onPromoted: () => void
}

export function PromoteAgentModal({ agent, onClose, onPromoted }: Props) {
  const [projects, setProjects] = useState<any[]>([])
  const [brainModules, setBrainModules] = useState<any[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [projRes, brainRes] = await Promise.all([fetch('/api/projects'), fetch('/api/brain')])
        setProjects(await projRes.json())
        setBrainModules(await brainRes.json())
      } catch {}
    }
    load()
  }, [])

  async function handlePromote() {
    setLoading(true)
    try {
      await fetch(`/api/agents/${agent.slug}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linked_projects: selectedProjects,
          linked_brain_modules: selectedModules,
        }),
      })
      onPromoted()
    } catch {
      alert('Failed to promote agent')
    } finally {
      setLoading(false)
    }
  }

  function toggleProject(slug: string) {
    setSelectedProjects(prev => prev.includes(slug) ? prev.filter(p => p !== slug) : [...prev, slug])
  }

  function toggleModule(path: string) {
    setSelectedModules(prev => prev.includes(path) ? prev.filter(m => m !== path) : [...prev, path])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-surface-3">
          <h2 className="text-lg font-bold text-ink-0">Promote Agent</h2>
          <p className="text-sm text-ink-3 mt-1">
            Promote <strong>{agent.name}</strong> from anon to brain-bound
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="label">Link to Projects</p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {projects.map(p => (
                <label key={p.slug} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedProjects.includes(p.slug)}
                    onChange={() => toggleProject(p.slug)} className="accent-brain-600" />
                  <span className="text-sm text-ink-1">{p.name}</span>
                </label>
              ))}
              {projects.length === 0 && <p className="text-xs text-ink-3">No projects available</p>}
            </div>
          </div>

          <div>
            <p className="label">Link to Brain Modules</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {brainModules.map((m: any) => (
                <label key={m.path} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedModules.includes(m.path)}
                    onChange={() => toggleModule(m.path)} className="accent-brain-600" />
                  <span className="text-sm text-ink-1 font-mono">{m.path}</span>
                  <span className="text-xs text-ink-3">{m.meta?.title}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-surface-3 flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handlePromote} disabled={loading}>
            {loading ? 'Promoting...' : 'Promote to Brain-Bound'}
          </button>
        </div>
      </div>
    </div>
  )
}
