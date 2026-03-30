// ============================================================
// Brain MVP — Core Type Definitions
// ============================================================

// --- Agent Types ---

export type AgentMode = 'anon' | 'brain-bound'
export type AgentStatus = 'active' | 'archived'

export interface AgentConfig {
  id: string
  name: string
  slug: string
  mode: AgentMode
  description: string
  system_prompt: string
  linked_projects: string[]
  linked_brain_modules: string[]
  tools: string[]
  tags: string[]
  status: AgentStatus
  promoted_from?: string // id of anon agent this was promoted from
  created_at: string
  updated_at: string
  archived_at?: string
}

export interface AgentCreateInput {
  name: string
  description: string
  mode?: AgentMode
  system_prompt?: string
  linked_projects?: string[]
  linked_brain_modules?: string[]
  tools?: string[]
  tags?: string[]
}

// --- Run Types ---

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface RunRecord {
  id: string
  agent_id: string
  agent_name: string
  agent_mode: AgentMode
  project_id?: string
  task: string
  status: RunStatus
  output?: string
  error?: string
  model: string
  provider: string
  linked_modules: string[]
  writeback_suggestions: WritebackSuggestion[]
  started_at: string
  completed_at?: string
  duration_ms?: number
}

// --- Writeback Types ---

export type WritebackType = 'memory' | 'priority' | 'project' | 'task' | 'note'
export type WritebackStatus = 'pending' | 'approved' | 'rejected' | 'applied'

export interface WritebackSuggestion {
  id: string
  run_id: string
  type: WritebackType
  target_module: string
  description: string
  content: string
  status: WritebackStatus
  reviewed_at?: string
  applied_at?: string
}

// --- Brain Module Types ---

export type ModuleVolatility = 'low' | 'medium' | 'high'

export interface BrainModuleMeta {
  title: string
  type?: string
  slug?: string
  salience?: number
  volatility?: ModuleVolatility
  last_updated?: string
  status?: string
  source?: string
  related_agents?: string[]
  related_projects?: string[]
  [key: string]: unknown
}

export interface BrainModule {
  path: string       // relative path from brain root
  meta: BrainModuleMeta
  content: string    // markdown body (without frontmatter)
  raw: string        // full file content
}

// --- Project Types ---

export type ProjectStatus = 'active' | 'archived' | 'paused'

export interface Project {
  slug: string
  name: string
  description: string
  status: ProjectStatus
  created_at: string
  updated_at: string
  linked_agents: string[]
  modules: string[] // paths to project brain modules
}

// --- Flow Types ---

export interface FlowState {
  active_focus: string
  priority_stack: PriorityItem[]
  blockers: Blocker[]
  recommended_actions: string[]
  recent_mutations: FlowMutation[]
  pending_writebacks: WritebackSuggestion[]
}

export interface PriorityItem {
  id: string
  title: string
  score: number
  urgency: number        // 0-1
  blockage_impact: number // 0-1
  goal_proximity: number  // 0-1
  dependency_weight: number // 0-1
  frequency: number       // 0-1
  user_emphasis: number   // 0-1
  project?: string
  source?: string
}

export interface Blocker {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  related_project?: string
  detected_at: string
}

export interface FlowMutation {
  id: string
  type: string
  description: string
  module: string
  timestamp: string
  agent?: string
}

// --- LLM Types ---

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMRequest {
  messages: LLMMessage[]
  model?: string
  max_tokens?: number
  temperature?: number
  system?: string
}

export interface LLMResponse {
  content: string
  model: string
  provider: string
  usage?: {
    input_tokens: number
    output_tokens: number
  }
  duration_ms?: number
}

export interface LLMProvider {
  name: string
  chat(request: LLMRequest): Promise<LLMResponse>
  listModels(): string[]
  defaultModel(): string
}

// --- Meta-Agent Types ---

export type MetaAgentRole =
  | 'context-loader'
  | 'priority-manager'
  | 'task-router'
  | 'memory-manager'
  | 'conflict-resolver'
  | 'summarizer'

export interface MetaAgent {
  role: MetaAgentRole
  name: string
  description: string
  execute(input: MetaAgentInput): Promise<MetaAgentOutput>
}

export interface MetaAgentInput {
  context: Record<string, unknown>
  brain_modules?: BrainModule[]
  run?: RunRecord
  suggestions?: WritebackSuggestion[]
}

export interface MetaAgentOutput {
  result: Record<string, unknown>
  mutations?: FlowMutation[]
  suggestions?: WritebackSuggestion[]
}
