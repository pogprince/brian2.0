import { NextRequest, NextResponse } from 'next/server'
import { META_AGENTS, getMetaAgent } from '@/lib/flow/meta-agents'

export async function GET() {
  const agents = Object.entries(META_AGENTS).map(([role, agent]) => ({
    role,
    name: agent.name,
    description: agent.description,
  }))
  return NextResponse.json(agents)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { role, input } = body

  const agent = getMetaAgent(role)
  if (!agent) return NextResponse.json({ error: `Meta-agent "${role}" not found` }, { status: 404 })

  const result = await agent.execute(input || { context: {} })
  return NextResponse.json(result)
}
