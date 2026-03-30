'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { clsx } from 'clsx'

export function TaskRunner() {
  const searchParams = useSearchParams()
  const preselectedAgent = searchParams.get('agent') || ''

  const [agents, setAgents] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState(preselectedAgent)
  const [selectedProject, setSelectedProject] = useState('')
  const [task, setTask] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    async function load() {
      try {
        const [agentsRes, projectsRes] = await Promise.all([fetch('/api/agents'), fetch('/api/projects')])
        const a = await agentsRes.json()
        setAgents(a.filter((ag: any) => ag.status === 'active' && !ag.tags?.includes('system')))
        setProjects(await projectsRes.json())
      } catch {}
    }
    load()
  }, [])

  async function handleRun() {
    if (!task.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const body: any = { task: task.trim() }
      if (selectedAgent) body.agent_slug = selectedAgent
      if (selectedProject) body.project_id = selectedProject

      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setResult(await res.json())
    } catch {
      setResult({ status: 'failed', error: 'Failed to connect to API' })
    } finally {
      setLoading(false)
    }
  }

  const selectedAgentData = agents.find(a => a.slug === selectedAgent)

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="card-padded">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Agent (optional — leave empty for anon)</label>
            <select className="input" value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
              <option value="">Quick spawn (anon)</option>
              {agents.map(a => (
                <option key={a.slug} value={a.slug}>
                  {a.name} ({a.mode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Project (optional)</label>
            <select className="input" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
              <option value="">No project</option>
              {projects.map(p => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedAgentData && (
          <div className="mb-4 p-3 bg-surface-1 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-ink-0">{selectedAgentData.name}</span>
              <span className={clsx(
                'badge',
                selectedAgentData.mode === 'brain-bound' ? 'badge-brain-bound' : 'badge-anon'
              )}>{selectedAgentData.mode}</span>
            </div>
            <p className="text-xs text-ink-2">{selectedAgentData.description}</p>
            {selectedAgentData.linked_brain_modules?.length > 0 && (
              <p className="text-xs text-ink-3 mt-1">
                Modules: {selectedAgentData.linked_brain_modules.join(', ')}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="label">Task</label>
          <textarea className="textarea h-32" placeholder="Describe what you want the agent to do..."
            value={task} onChange={e => setTask(e.target.value)} />
        </div>

        <div className="flex justify-end mt-4">
          <button className="btn-primary" onClick={handleRun} disabled={loading || !task.trim()}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running...
              </span>
            ) : 'Run Task'}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card-padded">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Run Result</h3>
            <div className="flex items-center gap-3">
              <span className={clsx('badge',
                result.status === 'completed' ? 'bg-green-100 text-green-800' :
                result.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-600'
              )}>{result.status}</span>
              {result.duration_ms && (
                <span className="text-xs text-ink-3">{(result.duration_ms / 1000).toFixed(1)}s</span>
              )}
              {result.model && (
                <span className="text-xs text-ink-4 font-mono">{result.model}</span>
              )}
            </div>
          </div>

          {result.output && (
            <div className="p-4 bg-surface-1 rounded-lg border border-surface-3 mb-4">
              <pre className="text-sm text-ink-1 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">{result.output}</pre>
            </div>
          )}

          {result.error && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm text-status-error">{result.error}</p>
            </div>
          )}

          {result.writeback_suggestions?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-ink-1 mb-2">Suggested Writebacks</p>
              <div className="space-y-2">
                {result.writeback_suggestions.map((wb: any) => (
                  <div key={wb.id} className="flex items-center gap-3 p-3 bg-brain-50 rounded-lg border border-brain-100">
                    <span className="badge badge-brain-bound">{wb.type}</span>
                    <span className="text-sm text-ink-1 flex-1">{wb.description}</span>
                    <span className="text-xs text-ink-3">{wb.target_module}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
