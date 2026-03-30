import { NextRequest, NextResponse } from 'next/server'
import { getProject, updateProject } from '@/lib/projects'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const project = await getProject(params.slug)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const body = await request.json()
  const project = await updateProject(params.slug, body)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}
