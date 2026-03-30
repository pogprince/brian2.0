import { NextRequest, NextResponse } from 'next/server'
import { getBrainModule, updateBrainModule } from '@/lib/brain'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const modulePath = params.path.join('/')
  const module = await getBrainModule(modulePath)
  if (!module) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(module)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const modulePath = params.path.join('/')
  const body = await request.json()
  const module = await updateBrainModule(modulePath, body.content, body.meta)
  return NextResponse.json(module)
}
