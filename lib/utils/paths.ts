import path from 'path'

const ROOT = process.cwd()

export const PATHS = {
  brain: path.join(ROOT, 'brain'),
  brainCore: path.join(ROOT, 'brain', 'core'),
  brainProjects: path.join(ROOT, 'brain', 'projects'),
  brainArchive: path.join(ROOT, 'brain', 'archive'),
  brainGenerated: path.join(ROOT, 'brain', 'generated'),
  data: path.join(ROOT, 'data'),
  agents: path.join(ROOT, 'data', 'agents'),
  runs: path.join(ROOT, 'data', 'runs'),
  projects: path.join(ROOT, 'data', 'projects'),
  flow: path.join(ROOT, 'data', 'flow'),
}

export function brainModulePath(relativePath: string): string {
  return path.join(PATHS.brain, relativePath)
}

export function agentFilePath(slug: string): string {
  return path.join(PATHS.agents, `${slug}.json`)
}

export function runFilePath(id: string): string {
  return path.join(PATHS.runs, `${id}.json`)
}

export function projectBrainPath(slug: string): string {
  return path.join(PATHS.brainProjects, slug)
}
