import { v4 as uuid } from 'uuid'
import path from 'path'
import type { AgentConfig, AgentCreateInput, AgentMode } from '@/lib/types'
import { readJson, writeJson, listFiles, fileExists } from '@/lib/utils/fs'
import { PATHS, agentFilePath } from '@/lib/utils/paths'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function createAgent(input: AgentCreateInput): Promise<AgentConfig> {
  const id = uuid()
  const slug = slugify(input.name)
  const now = new Date().toISOString()

  const agent: AgentConfig = {
    id,
    name: input.name,
    slug,
    mode: input.mode || 'anon',
    description: input.description,
    system_prompt: input.system_prompt || '',
    linked_projects: input.linked_projects || [],
    linked_brain_modules: input.linked_brain_modules || [],
    tools: input.tools || [],
    tags: input.tags || [],
    status: 'active',
    created_at: now,
    updated_at: now,
  }

  await writeJson(agentFilePath(slug), agent)
  return agent
}

export async function getAgent(slug: string): Promise<AgentConfig | null> {
  const filePath = agentFilePath(slug)
  if (!(await fileExists(filePath))) return null
  return readJson<AgentConfig>(filePath)
}

export async function listAgents(filters?: { mode?: AgentMode; status?: string; project?: string }): Promise<AgentConfig[]> {
  const files = await listFiles(PATHS.agents, '.json')
  const agents: AgentConfig[] = []

  for (const file of files) {
    const agent = await readJson<AgentConfig>(path.join(PATHS.agents, file))
    if (filters?.mode && agent.mode !== filters.mode) continue
    if (filters?.status && agent.status !== filters.status) continue
    if (filters?.project && !agent.linked_projects.includes(filters.project)) continue
    agents.push(agent)
  }

  return agents.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
}

export async function updateAgent(slug: string, updates: Partial<AgentConfig>): Promise<AgentConfig | null> {
  const agent = await getAgent(slug)
  if (!agent) return null

  const updated = {
    ...agent,
    ...updates,
    updated_at: new Date().toISOString(),
  }

  await writeJson(agentFilePath(slug), updated)
  return updated
}

export async function promoteAgent(slug: string, projectLinks: string[], brainModules: string[]): Promise<AgentConfig | null> {
  return updateAgent(slug, {
    mode: 'brain-bound',
    linked_projects: projectLinks,
    linked_brain_modules: brainModules,
    promoted_from: slug,
  })
}

export async function archiveAgent(slug: string): Promise<AgentConfig | null> {
  return updateAgent(slug, {
    status: 'archived',
    archived_at: new Date().toISOString(),
  })
}

export async function duplicateAgent(slug: string, newName: string): Promise<AgentConfig | null> {
  const original = await getAgent(slug)
  if (!original) return null

  return createAgent({
    name: newName,
    description: original.description,
    mode: original.mode,
    system_prompt: original.system_prompt,
    linked_projects: [...original.linked_projects],
    linked_brain_modules: [...original.linked_brain_modules],
    tools: [...original.tools],
    tags: [...original.tags],
  })
}
