import { NextRequest, NextResponse } from 'next/server'
import { getAgent, updateAgent, archiveAgent } from '@/lib/agents'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const agent = await getAgent(params.slug)
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(agent)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const body = await request.json()
  const agent = await updateAgent(params.slug, body)
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(agent)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const agent = await archiveAgent(params.slug)
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(agent)
}
