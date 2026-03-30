import { BrainViewer } from '@/components/brain/brain-viewer'

export default function BrainPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-0">Brain Modules</h1>
        <p className="text-sm text-ink-3 mt-1">Browse and edit your modular knowledge base</p>
      </div>
      <BrainViewer />
    </div>
  )
}
