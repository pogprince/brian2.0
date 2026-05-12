import { NextRequest, NextResponse } from 'next/server'
import { saveAudioFile, createCapture, generateCaptureId } from '@/lib/capture/storage'
import type { CaptureUrgency } from '@/lib/capture/types'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json({ error: 'audio file required' }, { status: 400 })
    }

    const project = (formData.get('project') as string | null) ?? 'brain'
    const urgency = ((formData.get('urgency') as string | null) ?? 'normal') as CaptureUrgency
    const tagsRaw = formData.get('tags') as string | null
    const tags: string[] = tagsRaw ? (JSON.parse(tagsRaw) as string[]) : []
    const source = (formData.get('source') as string | null) ?? 'mobile_voice'

    const id = generateCaptureId()
    const ext = audioFile.type.includes('mp4')
      ? 'mp4'
      : audioFile.type.includes('ogg')
        ? 'ogg'
        : 'webm'

    const buffer = Buffer.from(await audioFile.arrayBuffer())
    const audioPath = await saveAudioFile(id, buffer, ext)

    let content = '[Audio captured. Transcription pending.]'
    let transcriptStatus: 'pending' | 'done' | 'failed' = 'pending'

    if (process.env.OPENAI_API_KEY) {
      try {
        content = await transcribeAudio(buffer, ext, `${id}.${ext}`)
        transcriptStatus = 'done'
      } catch (err) {
        console.error('[capture/audio] transcription failed', err)
        transcriptStatus = 'failed'
        content = '[Audio captured. Transcription failed — retry later.]'
      }
    }

    const capture = await createCapture({
      id,
      content,
      type: 'audio',
      source: source as 'mobile_voice' | 'audio_upload',
      project,
      urgency,
      tags,
      audioPath,
      transcriptStatus,
    })

    const { filePath: _, ...safe } = capture
    return NextResponse.json({ capture: safe, audioPath }, { status: 201 })
  } catch (err) {
    console.error('[capture/audio] POST error', err)
    return NextResponse.json({ error: 'Failed to save audio capture' }, { status: 500 })
  }
}

async function transcribeAudio(buffer: Buffer, ext: string, filename: string): Promise<string> {
  const form = new FormData()
  const blob = new Blob([buffer], { type: `audio/${ext}` })
  form.append('file', blob, filename)
  form.append('model', 'whisper-1')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  })

  if (!res.ok) {
    throw new Error(`OpenAI transcription error: ${res.status}`)
  }

  const json = (await res.json()) as { text: string }
  return json.text
}
