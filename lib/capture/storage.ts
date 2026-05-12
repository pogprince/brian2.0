import path from 'path'
import fs from 'fs/promises'
import matter from 'gray-matter'
import { ensureDir, writeTextFile, readTextFile, walkFiles } from '@/lib/utils/fs'
import type { Capture, CaptureMeta, CaptureCreateInput, CaptureListItem } from './types'

const ROOT = process.cwd()

export const CAPTURE_PATHS = {
  captures: path.join(ROOT, 'data', 'captures'),
  audio: path.join(ROOT, 'data', 'media', 'audio'),
}

export function generateCaptureId(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '')
  const rand = Math.random().toString(16).slice(2, 6)
  return `cap_${date}_${time}_${rand}`
}

function dateParts(date: Date): { year: string; month: string } {
  return {
    year: date.getFullYear().toString(),
    month: (date.getMonth() + 1).toString().padStart(2, '0'),
  }
}

export function serializeCaptureMarkdown(meta: CaptureMeta, content: string): string {
  const cleanMeta = Object.fromEntries(
    Object.entries(meta).filter(([, v]) => v !== undefined && v !== null)
  )
  return matter.stringify(content, cleanMeta)
}

export function parseCaptureFile(filePath: string, raw: string): Capture {
  const { data, content } = matter(raw)
  return {
    ...(data as CaptureMeta),
    content: content.trim(),
    filePath,
  }
}

export async function createCapture(input: CaptureCreateInput): Promise<Capture> {
  const now = new Date()
  const id = input.id ?? generateCaptureId()
  const { year, month } = dateParts(now)
  const dir = path.join(CAPTURE_PATHS.captures, year, month)
  await ensureDir(dir)
  const filePath = path.join(dir, `${id}.md`)

  const meta: CaptureMeta = {
    id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    status: 'inbox',
    source: input.source ?? 'manual_text',
    type: input.type ?? 'idea',
    project: input.project ?? 'brain',
    urgency: input.urgency ?? 'normal',
    tags: input.tags ?? [],
    hasAudio: !!input.audioPath,
    ...(input.audioPath ? { audioPath: input.audioPath } : {}),
    ...(input.transcriptStatus ? { transcriptStatus: input.transcriptStatus } : {}),
    ...(input.url ? { url: input.url } : {}),
    ...(input.fileRefs?.length ? { fileRefs: input.fileRefs } : {}),
  }

  const raw = serializeCaptureMarkdown(meta, input.content ?? '')
  await writeTextFile(filePath, raw)

  return { ...meta, content: input.content ?? '', filePath }
}

export async function listCaptures(limit = 10): Promise<CaptureListItem[]> {
  const allFiles = await walkFiles(CAPTURE_PATHS.captures, '.md')
  // filenames sort newest-first because YYYY/MM/cap_YYYYMMDD_HHMMSS are lexicographically ordered
  allFiles.sort((a, b) => b.localeCompare(a))
  const recent = allFiles.slice(0, limit)

  const items: CaptureListItem[] = []
  for (const filePath of recent) {
    try {
      const raw = await readTextFile(filePath)
      const capture = parseCaptureFile(filePath, raw)
      const preview = capture.content.slice(0, 160).replace(/\n/g, ' ')
      items.push({ ...capture, preview })
    } catch {
      // skip corrupt files
    }
  }
  return items
}

export async function saveAudioFile(id: string, buffer: Buffer, ext = 'webm'): Promise<string> {
  const now = new Date()
  const { year, month } = dateParts(now)
  const dir = path.join(CAPTURE_PATHS.audio, year, month)
  await ensureDir(dir)
  const filename = `${id}.${ext}`
  await fs.writeFile(path.join(dir, filename), buffer)
  return path.join('data', 'media', 'audio', year, month, filename)
}
