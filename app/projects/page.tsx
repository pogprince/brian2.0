import { ProjectList } from '@/components/projects/project-list'

export default function ProjectsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-0">Projects</h1>
        <p className="text-sm text-ink-3 mt-1">Manage your projects and their context</p>
      </div>
      <ProjectList />
    </div>
  )
}
