import { v4 as uuid } from 'uuid'
import path from 'path'
import type { RunRecord, RunStatus, WritebackSuggestion } from '@/lib/types'
import { readJson, writeJson, listFiles } from '@/lib/utils/fs'
import { PATHS, runFilePath } from '@/lib/utils/paths'

export async function createRun(params: {
  agent_id: string
  agent_name: string
  agent_mode: 'anon' | 'brain-bound'
  task: string
  project_id?: string
  model: string
  provider: string
  linked_modules: string[]
}): Promise<RunRecord> {
  const id = uuid()
  const now = new Date().toISOString()

  const run: RunRecord = {
    id,
    ...params,
    status: 'pending',
    writeback_suggestions: [],
    started_at: now,
  }

  await writeJson(runFilePath(id), run)
  return run
}

export async function updateRun(id: string, updates: Partial<RunRecord>): Promise<RunRecord | null> {
  const run = await getRun(id)
  if (!run) return null

  const updated = { ...run, ...updates }
  if (updates.status === 'completed' || updates.status === 'failed') {
    updated.completed_at = new Date().toISOString()
    updated.duration_ms = new Date(updated.completed_at).getTime() - new Date(updated.started_at).getTime()
  }

  await writeJson(runFilePath(id), updated)
  return updated
}

export async function getRun(id: string): Promise<RunRecord | null> {
  try {
    return await readJson<RunRecord>(runFilePath(id))
  } catch {
    return null
  }
}

export async function listRuns(filters?: {
  agent_id?: string
  project_id?: string
  status?: RunStatus
  limit?: number
}): Promise<RunRecord[]> {
  const files = await listFiles(PATHS.runs, '.json')
  const runs: RunRecord[] = []

  for (const file of files) {
    if (file === '.gitkeep') continue
    const run = await readJson<RunRecord>(path.join(PATHS.runs, file))
    if (filters?.agent_id && run.agent_id !== filters.agent_id) continue
    if (filters?.project_id && run.project_id !== filters.project_id) continue
    if (filters?.status && run.status !== filters.status) continue
    runs.push(run)
  }

  const sorted = runs.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
  return filters?.limit ? sorted.slice(0, filters.limit) : sorted
}

export async function addWritebackSuggestion(runId: string, suggestion: Omit<WritebackSuggestion, 'id' | 'run_id'>): Promise<WritebackSuggestion> {
  const run = await getRun(runId)
  if (!run) throw new Error(`Run ${runId} not found`)

  const wb: WritebackSuggestion = {
    id: uuid(),
    run_id: runId,
    ...suggestion,
  }

  run.writeback_suggestions.push(wb)
  await writeJson(runFilePath(runId), run)
  return wb
}

// Extension point: streaming run output, real-time status updates
