import type { FlowState, FlowMutation, WritebackSuggestion, PriorityItem, Blocker } from '@/lib/types'
import { readJson, writeJson, fileExists } from '@/lib/utils/fs'
import { PATHS } from '@/lib/utils/paths'
import { rankPriorities } from '@/lib/utils/priority'
import path from 'path'

const FLOW_STATE_PATH = path.join(PATHS.flow, 'state.json')

function defaultFlowState(): FlowState {
  return {
    active_focus: 'System initialized. Set your active focus.',
    priority_stack: [],
    blockers: [],
    recommended_actions: ['Configure your brain modules', 'Create your first agent', 'Set active focus'],
    recent_mutations: [],
    pending_writebacks: [],
  }
}

export async function getFlowState(): Promise<FlowState> {
  if (!(await fileExists(FLOW_STATE_PATH))) {
    const state = defaultFlowState()
    await writeJson(FLOW_STATE_PATH, state)
    return state
  }
  return readJson<FlowState>(FLOW_STATE_PATH)
}

export async function updateFlowState(updates: Partial<FlowState>): Promise<FlowState> {
  const state = await getFlowState()
  const updated = { ...state, ...updates }

  if (updates.priority_stack) {
    updated.priority_stack = rankPriorities(updates.priority_stack)
  }

  await writeJson(FLOW_STATE_PATH, updated)
  return updated
}

export async function addFlowMutation(mutation: Omit<FlowMutation, 'id' | 'timestamp'>): Promise<FlowMutation> {
  const state = await getFlowState()
  const entry: FlowMutation = {
    ...mutation,
    id: `mut-${Date.now()}`,
    timestamp: new Date().toISOString(),
  }

  // Keep last 50 mutations
  state.recent_mutations = [entry, ...state.recent_mutations].slice(0, 50)
  await writeJson(FLOW_STATE_PATH, state)
  return entry
}

export async function addPendingWriteback(suggestion: WritebackSuggestion): Promise<void> {
  const state = await getFlowState()
  state.pending_writebacks.push(suggestion)
  await writeJson(FLOW_STATE_PATH, state)
}

export async function resolvePendingWriteback(id: string, status: 'approved' | 'rejected'): Promise<WritebackSuggestion | null> {
  const state = await getFlowState()
  const idx = state.pending_writebacks.findIndex(w => w.id === id)
  if (idx === -1) return null

  state.pending_writebacks[idx].status = status
  state.pending_writebacks[idx].reviewed_at = new Date().toISOString()

  const resolved = state.pending_writebacks[idx]

  if (status === 'rejected') {
    state.pending_writebacks.splice(idx, 1)
  }

  await writeJson(FLOW_STATE_PATH, state)
  return resolved
}

export async function addBlocker(blocker: Omit<Blocker, 'id' | 'detected_at'>): Promise<Blocker> {
  const state = await getFlowState()
  const entry: Blocker = {
    ...blocker,
    id: `block-${Date.now()}`,
    detected_at: new Date().toISOString(),
  }
  state.blockers.push(entry)
  await writeJson(FLOW_STATE_PATH, state)
  return entry
}

export async function removeBlocker(id: string): Promise<void> {
  const state = await getFlowState()
  state.blockers = state.blockers.filter(b => b.id !== id)
  await writeJson(FLOW_STATE_PATH, state)
}
