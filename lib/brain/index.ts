import fs from 'fs/promises'
import path from 'path'
import type { BrainModule, BrainModuleMeta } from '@/lib/types'
import { PATHS } from '@/lib/utils/paths'
import { walkFiles, readTextFile, writeTextFile } from '@/lib/utils/fs'
import { parseMarkdownModule, serializeMarkdownModule, updateModuleMeta } from '@/lib/utils/markdown'

export async function listBrainModules(): Promise<BrainModule[]> {
  const files = await walkFiles(PATHS.brain, '.md')
  const modules: BrainModule[] = []

  for (const file of files) {
    const raw = await readTextFile(file)
    const relativePath = path.relative(PATHS.brain, file).replace(/\\/g, '/')
    modules.push(parseMarkdownModule(relativePath, raw))
  }

  return modules.sort((a, b) => (b.meta.salience || 0) - (a.meta.salience || 0))
}

export async function getBrainModule(relativePath: string): Promise<BrainModule | null> {
  const fullPath = path.join(PATHS.brain, relativePath)
  try {
    const raw = await readTextFile(fullPath)
    return parseMarkdownModule(relativePath, raw)
  } catch {
    return null
  }
}

export async function updateBrainModule(
  relativePath: string,
  content: string,
  metaUpdates?: Partial<BrainModuleMeta>
): Promise<BrainModule> {
  const fullPath = path.join(PATHS.brain, relativePath)
  const existing = await getBrainModule(relativePath)

  const meta: BrainModuleMeta = {
    ...(existing?.meta || { title: path.basename(relativePath, '.md') }),
    ...metaUpdates,
    last_updated: new Date().toISOString().split('T')[0],
  }

  const raw = serializeMarkdownModule(meta, content)
  await writeTextFile(fullPath, raw)
  return parseMarkdownModule(relativePath, raw)
}

export async function getModulesByProject(projectSlug: string): Promise<BrainModule[]> {
  const projectPath = path.join(PATHS.brainProjects, projectSlug)
  const files = await walkFiles(projectPath, '.md')
  const modules: BrainModule[] = []

  for (const file of files) {
    const raw = await readTextFile(file)
    const relativePath = path.relative(PATHS.brain, file).replace(/\\/g, '/')
    modules.push(parseMarkdownModule(relativePath, raw))
  }

  return modules
}

export async function getCoreModules(): Promise<BrainModule[]> {
  const files = await walkFiles(PATHS.brainCore, '.md')
  const modules: BrainModule[] = []

  for (const file of files) {
    const raw = await readTextFile(file)
    const relativePath = path.relative(PATHS.brain, file).replace(/\\/g, '/')
    modules.push(parseMarkdownModule(relativePath, raw))
  }

  return modules
}

// Extension point: future vector indexing of brain modules
// export async function indexModules(): Promise<void> { ... }
// export async function searchModules(query: string): Promise<BrainModule[]> { ... }
