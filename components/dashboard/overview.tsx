'use client'

import { QuickSpawn } from './quick-spawn'
import { StatsGrid } from './stats-grid'
import { ActiveFocus } from './active-focus'
import { RecentRuns } from './recent-runs'
import { RecommendedActions } from './recommended-actions'

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <QuickSpawn />
      <StatsGrid />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveFocus />
        <RecommendedActions />
      </div>
      <RecentRuns />
    </div>
  )
}
