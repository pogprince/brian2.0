import { FlowPanel } from '@/components/flow/flow-panel'

export default function FlowPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-0">Flow Panel</h1>
        <p className="text-sm text-ink-3 mt-1">Monitor your cognitive flow state, priorities, and pending writebacks</p>
      </div>
      <FlowPanel />
    </div>
  )
}
