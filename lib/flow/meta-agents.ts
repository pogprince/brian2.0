import type { MetaAgent, MetaAgentInput, MetaAgentOutput, BrainModule, WritebackSuggestion, FlowMutation } from '@/lib/types'
import { getCoreModules, getModulesByProject } from '@/lib/brain'
import { computePriorityScore } from '@/lib/utils/priority'

// --- Context Loader ---
// Responsible for determining which brain modules to load for a given run

export const contextLoader: MetaAgent = {
  role: 'context-loader',
  name: 'Context Loader',
  description: 'Determines which brain modules to load based on task, agent, and project context.',

  async execute(input: MetaAgentInput): Promise<MetaAgentOutput> {
    const modules: BrainModule[] = []

    // Always load core modules for brain-bound agents
    if (input.context.mode === 'brain-bound') {
      const core = await getCoreModules()
      modules.push(...core)
    }

    // Load project-specific modules if a project is linked
    const projectSlug = input.context.project as string
    if (projectSlug) {
      const projectModules = await getModulesByProject(projectSlug)
      modules.push(...projectModules)
    }

    // Filter by salience threshold
    const threshold = (input.context.salience_threshold as number) || 0.3
    const filtered = modules.filter(m => (m.meta.salience || 0.5) >= threshold)

    return {
      result: {
        loaded_modules: filtered.map(m => m.path),
        module_count: filtered.length,
      },
    }
  },
}

// --- Priority Manager ---
// Manages the priority stack and scoring

export const priorityManager: MetaAgent = {
  role: 'priority-manager',
  name: 'Priority Manager',
  description: 'Evaluates and reorders priorities based on urgency, dependencies, and goals.',

  async execute(input: MetaAgentInput): Promise<MetaAgentOutput> {
    const items = (input.context.items || []) as Array<Record<string, unknown>>

    const scored = items.map(item => ({
      id: item.id as string || `pri-${Date.now()}`,
      title: item.title as string || 'Untitled',
      urgency: (item.urgency as number) || 0.5,
      blockage_impact: (item.blockage_impact as number) || 0.3,
      goal_proximity: (item.goal_proximity as number) || 0.5,
      dependency_weight: (item.dependency_weight as number) || 0.3,
      frequency: (item.frequency as number) || 0.3,
      user_emphasis: (item.user_emphasis as number) || 0.5,
      project: item.project as string | undefined,
      source: item.source as string | undefined,
      score: 0,
    }))

    for (const item of scored) {
      item.score = computePriorityScore(item)
    }

    scored.sort((a, b) => b.score - a.score)

    return {
      result: { priority_stack: scored },
    }
  },
}

// --- Task Router ---
// Decides which agent should handle a task

export const taskRouter: MetaAgent = {
  role: 'task-router',
  name: 'Task Router',
  description: 'Routes tasks to the most appropriate agent based on capabilities and context.',

  async execute(input: MetaAgentInput): Promise<MetaAgentOutput> {
    const task = input.context.task as string
    const availableAgents = input.context.agents as Array<Record<string, unknown>> || []

    // Simple keyword matching for MVP — extension point for LLM-based routing
    const scored = availableAgents.map(agent => {
      const desc = ((agent.description as string) || '').toLowerCase()
      const tags = (agent.tags as string[]) || []
      const taskLower = task.toLowerCase()
      const words = taskLower.split(/\s+/)

      let relevance = 0
      for (const word of words) {
        if (desc.includes(word)) relevance += 0.2
        if (tags.some(t => t.includes(word))) relevance += 0.3
      }

      return { agent, relevance: Math.min(relevance, 1) }
    })

    scored.sort((a, b) => b.relevance - a.relevance)

    return {
      result: {
        recommended_agent: scored[0]?.agent || null,
        all_scored: scored.map(s => ({ slug: s.agent.slug, relevance: s.relevance })),
      },
    }
  },
}

// --- Memory Manager ---
// Handles writeback validation and memory lifecycle

export const memoryManager: MetaAgent = {
  role: 'memory-manager',
  name: 'Memory Manager',
  description: 'Validates writeback suggestions and manages memory lifecycle (salience, archival, compression).',

  async execute(input: MetaAgentInput): Promise<MetaAgentOutput> {
    const suggestions = input.suggestions || []
    const mutations: FlowMutation[] = []
    const approved: WritebackSuggestion[] = []

    for (const suggestion of suggestions) {
      // MVP: auto-approve with logging — extension point for LLM-based validation
      approved.push({
        ...suggestion,
        status: 'pending', // stays pending until user reviews
      })

      mutations.push({
        id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'writeback-queued',
        description: `Writeback suggested: ${suggestion.description}`,
        module: suggestion.target_module,
        timestamp: new Date().toISOString(),
        agent: 'memory-manager',
      })
    }

    return {
      result: { approved_count: approved.length, total: suggestions.length },
      mutations,
      suggestions: approved,
    }
  },
}

// --- Conflict Resolver ---
// Detects and surfaces contradictions

export const conflictResolver: MetaAgent = {
  role: 'conflict-resolver',
  name: 'Conflict Resolver',
  description: 'Detects contradictions between brain modules, priorities, and incoming information.',

  async execute(input: MetaAgentInput): Promise<MetaAgentOutput> {
    // MVP: placeholder — extension point for LLM-based conflict detection
    const conflicts: Array<{ module_a: string; module_b: string; description: string }> = []

    return {
      result: {
        conflicts_found: conflicts.length,
        conflicts,
        status: conflicts.length === 0 ? 'clean' : 'conflicts_detected',
      },
    }
  },
}

// --- Summarizer ---
// Compresses old information

export const summarizer: MetaAgent = {
  role: 'summarizer',
  name: 'Summarizer',
  description: 'Compresses and summarizes old or low-salience information while preserving the original.',

  async execute(input: MetaAgentInput): Promise<MetaAgentOutput> {
    // MVP: placeholder — extension point for LLM-based summarization
    const modules = input.brain_modules || []
    const candidates = modules.filter(m => (m.meta.salience || 0.5) < 0.3)

    return {
      result: {
        candidates_for_compression: candidates.map(m => m.path),
        status: 'review_needed',
      },
    }
  },
}

// Registry of all meta-agents
export const META_AGENTS: Record<string, MetaAgent> = {
  'context-loader': contextLoader,
  'priority-manager': priorityManager,
  'task-router': taskRouter,
  'memory-manager': memoryManager,
  'conflict-resolver': conflictResolver,
  'summarizer': summarizer,
}

export function getMetaAgent(role: string): MetaAgent | null {
  return META_AGENTS[role] || null
}
