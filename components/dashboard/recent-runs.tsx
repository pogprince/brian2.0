'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'

const statusStyles: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  running: 'bg-blue-100 text-blue-800',
  pending: 'bg-gray-100 text-gray-600',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

export function RecentRuns() {
  const [runs, setRuns] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/runs?limit=5')
        setRuns(await res.json())
      } catch {}
    }
    load()
  }, [])

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-surface-3 flex items-center justify-between">
        <h3 className="section-title">Recent Runs</h3>
        <Link href="/runs" className="text-sm text-brain-600 hover:text-brain-700 font-medium">View all</Link>
      </div>
      {runs.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-ink-3">No runs yet. Use Quick Spawn above to run your first task.</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-3">
          {runs.map((run: any) => (
            <div key={run.id} className="px-5 py-3 flex items-center gap-4 hover:bg-surface-1 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-0 truncate">{run.task}</p>
                <p className="text-xs text-ink-3 mt-0.5">{run.agent_name} &middot; {run.agent_mode}</p>
              </div>
              <span className={clsx('badge', statusStyles[run.status] || statusStyles.pending)}>{run.status}</span>
              <span className="text-xs text-ink-4 whitespace-nowrap">{new Date(run.started_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
