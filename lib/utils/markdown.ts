import matter from 'gray-matter'
import type { BrainModule, BrainModuleMeta } from '@/lib/types'

export function parseMarkdownModule(filePath: string, raw: string): BrainModule {
  const { data, content } = matter(raw)
  return {
    path: filePath,
    meta: data as BrainModuleMeta,
    content: content.trim(),
    raw,
  }
}

export function serializeMarkdownModule(meta: BrainModuleMeta, content: string): string {
  return matter.stringify(content, meta)
}

export function updateModuleMeta(raw: string, updates: Partial<BrainModuleMeta>): string {
  const { data, content } = matter(raw)
  const newMeta = { ...data, ...updates, last_updated: new Date().toISOString().split('T')[0] }
  return matter.stringify(content, newMeta)
}
