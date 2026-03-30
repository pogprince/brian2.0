import { AgentLibrary } from '@/components/agents/agent-library'

export default function AgentsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-0">Agent Library</h1>
        <p className="text-sm text-ink-3 mt-1">Create, manage, and promote your agents</p>
      </div>
      <AgentLibrary />
    </div>
  )
}
