import { RunHistory } from '@/components/runs/run-history'

export default function RunsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-0">Run History</h1>
        <p className="text-sm text-ink-3 mt-1">Browse all agent runs and their results</p>
      </div>
      <RunHistory />
    </div>
  )
}
