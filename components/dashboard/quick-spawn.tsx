'use client'

import { useState } from 'react'

export function QuickSpawn() {
  const [task, setTask] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleRun() {
    if (!task.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: task.trim() }),
      })
      const run = await res.json()
      if (run.status === 'completed') {
        setResult(run.output || 'Task completed.')
      } else if (run.status === 'failed') {
        setResult(`Error: ${run.error || 'Task failed.'}`)
      } else {
        setResult(`Run started (${run.id}). Status: ${run.status}`)
      }
    } catch {
      setResult('Failed to start run. Check your API key configuration.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-padded">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
        <h2 className="text-sm font-semibold text-ink-1 uppercase tracking-wider">Quick Spawn</h2>
      </div>
      <div className="flex gap-3">
        <input type="text" className="input flex-1"
          placeholder="Describe a task and run it instantly (anon agent)..."
          value={task} onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleRun()}
          disabled={loading} />
        <button className="btn-primary whitespace-nowrap" onClick={handleRun}
          disabled={loading || !task.trim()}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running...
            </span>
          ) : 'Run Task'}
        </button>
      </div>
      {result && (
        <div className="mt-4 p-4 bg-surface-1 rounded-lg border border-surface-3">
          <p className="text-xs font-medium text-ink-3 mb-1 uppercase">Output</p>
          <pre className="text-sm text-ink-1 whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">{result}</pre>
        </div>
      )}
    </div>
  )
}
