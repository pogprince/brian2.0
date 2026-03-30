import { NextRequest, NextResponse } from 'next/server'
import { listAgents, createAgent } from '@/lib/agents'
import type { AgentMode } from '@/lib/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') as AgentMode | null
  const status = searchParams.get('status') || undefined
  const project = searchParams.get('project') || undefined

  const agents = await listAgents({
    mode: mode || undefined,
    status,
    project,
  })

  return NextResponse.json(agents)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const agent = await createAgent(body)
  return NextResponse.json(agent, { status: 201 })
}
