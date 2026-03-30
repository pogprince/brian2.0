import { DashboardOverview } from '@/components/dashboard/overview'

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-0">Dashboard</h1>
        <p className="text-sm text-ink-3 mt-1">Your cognitive operating system at a glance</p>
      </div>
      <DashboardOverview />
    </div>
  )
}
