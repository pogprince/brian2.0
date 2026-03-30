import path from 'path'
import type { Project, ProjectStatus } from '@/lib/types'
import { readJson, writeJson, listFiles, fileExists, ensureDir } from '@/lib/utils/fs'
import { PATHS, projectBrainPath } from '@/lib/utils/paths'

function projectFilePath(slug: string): string {
  return path.join(PATHS.projects, `${slug}.json`)
}

export async function createProject(params: {
  name: string
  slug: string
  description: string
}): Promise<Project> {
  const now = new Date().toISOString()

  const project: Project = {
    ...params,
    status: 'active',
    created_at: now,
    updated_at: now,
    linked_agents: [],
    modules: [],
  }

  await writeJson(projectFilePath(params.slug), project)

  // Create project brain directory with default modules
  const projBrainDir = projectBrainPath(params.slug)
  await ensureDir(projBrainDir)

  return project
}

export async function getProject(slug: string): Promise<Project | null> {
  const filePath = projectFilePath(slug)
  if (!(await fileExists(filePath))) return null
  return readJson<Project>(filePath)
}

export async function listProjects(filters?: { status?: ProjectStatus }): Promise<Project[]> {
  const files = await listFiles(PATHS.projects, '.json')
  const projects: Project[] = []

  for (const file of files) {
    const project = await readJson<Project>(path.join(PATHS.projects, file))
    if (filters?.status && project.status !== filters.status) continue
    projects.push(project)
  }

  return projects.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
}

export async function updateProject(slug: string, updates: Partial<Project>): Promise<Project | null> {
  const project = await getProject(slug)
  if (!project) return null

  const updated = {
    ...project,
    ...updates,
    updated_at: new Date().toISOString(),
  }

  await writeJson(projectFilePath(slug), updated)
  return updated
}
