import { Suspense } from 'react'
import { TaskRunner } from '@/components/runner/task-runner'

export default function RunnerPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-0">Task Runner</h1>
        <p className="text-sm text-ink-3 mt-1">Pick an agent and run a task, or quick-spawn from a prompt</p>
      </div>
      <Suspense fallback={<div className="text-ink-3">Loading runner...</div>}>
        <TaskRunner />
      </Suspense>
    </div>
  )
}
