import { NextRequest, NextResponse } from 'next/server'
import { duplicateAgent } from '@/lib/agents'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const body = await request.json()
  const agent = await duplicateAgent(params.slug, body.name)
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(agent, { status: 201 })
}
