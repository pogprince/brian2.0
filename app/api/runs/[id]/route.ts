import { NextRequest, NextResponse } from 'next/server'
import { getRun } from '@/lib/runs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const run = await getRun(params.id)
  if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(run)
}
