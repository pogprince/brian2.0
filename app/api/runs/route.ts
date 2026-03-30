import { NextRequest, NextResponse } from 'next/server'
import { listRuns } from '@/lib/runs'
import { getAgent } from '@/lib/agents'
import { executeTask } from '@/lib/flow/runner'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const agent_id = searchParams.get('agent_id') || undefined
  const project_id = searchParams.get('project_id') || undefined
  const status = searchParams.get('status') as any || undefined
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

  const runs = await listRuns({ agent_id, project_id, status, limit })
  return NextResponse.json(runs)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { agent_slug, task, project_id } = body

  if (!task) {
    return NextResponse.json({ error: 'Task is required' }, { status: 400 })
  }

  // If no agent specified, create an anon agent on the fly
  let agent
  if (agent_slug) {
    agent = await getAgent(agent_slug)
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  } else {
    // Quick-spawn anon agent
    const { createAgent } = await import('@/lib/agents')
    agent = await createAgent({
      name: `anon-${Date.now()}`,
      description: task.slice(0, 100),
      mode: 'anon',
    })
  }

  const run = await executeTask({ task, agent, project_id })
  return NextResponse.json(run, { status: 201 })
}
