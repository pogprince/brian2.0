import type { PriorityItem } from '@/lib/types'

const WEIGHTS = {
  urgency: 0.25,
  blockage_impact: 0.20,
  goal_proximity: 0.20,
  dependency_weight: 0.15,
  frequency: 0.10,
  user_emphasis: 0.10,
}

export function computePriorityScore(item: Omit<PriorityItem, 'score' | 'id'>): number {
  return (
    item.urgency * WEIGHTS.urgency +
    item.blockage_impact * WEIGHTS.blockage_impact +
    item.goal_proximity * WEIGHTS.goal_proximity +
    item.dependency_weight * WEIGHTS.dependency_weight +
    item.frequency * WEIGHTS.frequency +
    item.user_emphasis * WEIGHTS.user_emphasis
  )
}

export function rankPriorities(items: PriorityItem[]): PriorityItem[] {
  return [...items].sort((a, b) => b.score - a.score)
}

// Extension point: future versions can incorporate decay, time-based urgency, etc.
export function applyDecay(score: number, daysSinceUpdate: number, rate = 0.02): number {
  return score * Math.exp(-rate * daysSinceUpdate)
}
