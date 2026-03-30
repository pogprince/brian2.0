import { NextRequest, NextResponse } from 'next/server'
import { promoteAgent } from '@/lib/agents'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const body = await request.json()
  const agent = await promoteAgent(
    params.slug,
    body.linked_projects || [],
    body.linked_brain_modules || []
  )
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(agent)
}
