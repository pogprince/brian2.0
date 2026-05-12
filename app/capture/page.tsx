import { listCaptures } from '@/lib/capture/storage'
import { CapturePage } from '@/components/capture/capture-page'
import type { CaptureListItem } from '@/lib/capture/types'

export const metadata = {
  title: 'Capture — Brain',
  description: 'Low-friction intake for thoughts, ideas, links, and voice.',
}

export default async function CaptureRoute() {
  let initialCaptures: Omit<CaptureListItem, 'filePath'>[] = []
  try {
    const items = await listCaptures(10)
    initialCaptures = items.map(({ filePath: _, ...rest }) => rest)
  } catch {
    // first visit — no captures directory yet
  }

  return <CapturePage initialCaptures={initialCaptures} />
}
