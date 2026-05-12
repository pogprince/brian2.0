import { NextRequest, NextResponse } from 'next/server'
import { createCapture, listCaptures } from '@/lib/capture/storage'
import type { CaptureCreateInput } from '@/lib/capture/types'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '10', 10), 100)
    const captures = await listCaptures(limit)
    // strip absolute filePaths before sending to client
    const safe = captures.map(({ filePath: _, ...rest }) => rest)
    return NextResponse.json({ captures: safe })
  } catch (err) {
    console.error('[capture] GET error', err)
    return NextResponse.json({ error: 'Failed to list captures' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CaptureCreateInput

    if (!body.content && !body.audioPath) {
      return NextResponse.json({ error: 'content or audioPath required' }, { status: 400 })
    }

    const capture = await createCapture({
      content: body.content ?? '',
      type: body.type,
      source: body.source,
      project: body.project,
      urgency: body.urgency,
      tags: body.tags,
      url: body.url,
      fileRefs: body.fileRefs,
      audioPath: body.audioPath,
      transcriptStatus: body.transcriptStatus,
    })

    const { filePath: _, ...safe } = capture
    return NextResponse.json({ capture: safe }, { status: 201 })
  } catch (err) {
    console.error('[capture] POST error', err)
    return NextResponse.json({ error: 'Failed to save capture' }, { status: 500 })
  }
}
