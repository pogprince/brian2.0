import { NextRequest, NextResponse } from 'next/server'
import { listProjects, createProject } from '@/lib/projects'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as 'active' | 'archived' | null
  const projects = await listProjects({ status: status || undefined })
  return NextResponse.json(projects)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const project = await createProject(body)
  return NextResponse.json(project, { status: 201 })
}
