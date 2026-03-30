'use client'

import { useEffect, useState } from 'react'

interface Stats {
  totalAgents: number
  anonAgents: number
  brainBoundAgents: number
  totalRuns: number
  activeProjects: number
  pendingWritebacks: number
}

export function StatsGrid() {
  const [stats, setStats] = useState<Stats>({
    totalAgents: 0, anonAgents: 0, brainBoundAgents: 0,
    totalRuns: 0, activeProjects: 0, pendingWritebacks: 0,
  })

  useEffect(() => {
    async function load() {
      try {
        const [agentsRes, runsRes, projectsRes, flowRes] = await Promise.all([
          fetch('/api/agents'), fetch('/api/runs'), fetch('/api/projects'), fetch('/api/flow'),
        ])
        const agents = await agentsRes.json()
        const runs = await runsRes.json()
        const projects = await projectsRes.json()
        const flow = await flowRes.json()
        setStats({
          totalAgents: agents.length,
          anonAgents: agents.filter((a: any) => a.mode === 'anon').length,
          brainBoundAgents: agents.filter((a: any) => a.mode === 'brain-bound').length,
          totalRuns: runs.length,
          activeProjects: projects.filter((p: any) => p.status === 'active').length,
          pendingWritebacks: flow.pending_writebacks?.length || 0,
        })
      } catch {}
    }
    load()
  }, [])

  const items = [
    { label: 'Total Agents', value: stats.totalAgents, color: 'text-brain-600' },
    { label: 'Anon', value: stats.anonAgents, color: 'text-amber-600' },
    { label: 'Brain-Bound', value: stats.brainBoundAgents, color: 'text-brain-600' },
    { label: 'Total Runs', value: stats.totalRuns, color: 'text-ink-0' },
    { label: 'Projects', value: stats.activeProjects, color: 'text-status-success' },
    { label: 'Pending Writebacks', value: stats.pendingWritebacks, color: 'text-status-warning' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((item) => (
        <div key={item.label} className="card-padded text-center">
          <p className={`stat-value ${item.color}`}>{item.value}</p>
          <p className="stat-label mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
