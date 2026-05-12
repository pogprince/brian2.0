'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { clsx } from 'clsx'
import type { CaptureListItem, CaptureType, CaptureUrgency } from '@/lib/capture/types'

type DisplayCapture = Omit<CaptureListItem, 'filePath'>

type RecorderState = 'idle' | 'requesting' | 'recording' | 'stopped' | 'saving' | 'error'

const URGENCY_OPTIONS: CaptureUrgency[] = ['low', 'normal', 'high', 'asap']
const TYPE_OPTIONS: CaptureType[] = ['idea', 'task', 'link', 'quote', 'observation', 'transcript', 'file']

interface Props {
  initialCaptures: DisplayCapture[]
}

export function CapturePage({ initialCaptures }: Props) {
  // text capture
  const [content, setContent] = useState('')
  const [project, setProject] = useState('brain')
  const [type, setType] = useState<CaptureType>('idea')
  const [urgency, setUrgency] = useState<CaptureUrgency>('normal')
  const [tags, setTags] = useState('')
  const [url, setUrl] = useState('')
  const [metaOpen, setMetaOpen] = useState(false)

  // audio recorder
  const [recorderState, setRecorderState] = useState<RecorderState>('idle')
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recorderError, setRecorderError] = useState('')
  const [micSupported, setMicSupported] = useState(true)

  // form
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [captures, setCaptures] = useState<DisplayCapture[]>(initialCaptures)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicSupported(false)
    }
  }, [])

  const refreshCaptures = useCallback(async () => {
    try {
      const res = await fetch('/api/capture?limit=10')
      if (res.ok) {
        const data = (await res.json()) as { captures: DisplayCapture[] }
        setCaptures(data.captures)
      }
    } catch {
      // best-effort refresh
    }
  }, [])

  const startRecording = useCallback(async () => {
    setRecorderError('')
    setAudioBlob(null)
    setRecorderState('requesting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
        setRecorderState('stopped')
      }

      recorder.start(500)
      setRecorderState('recording')
      setRecordingDuration(0)

      timerRef.current = setInterval(() => setRecordingDuration((d: number) => d + 1), 1000)
    } catch (err: unknown) {
      const error = err as Error
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setRecorderError('Microphone access denied. Allow it in your browser settings and try again.')
      } else {
        setRecorderError(`Could not access microphone: ${error.message}`)
      }
      setRecorderState('error')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recorderState === 'recording') {
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [recorderState])

  const discardRecording = useCallback(() => {
    if (mediaRecorderRef.current && recorderState === 'recording') {
      mediaRecorderRef.current.stop()
      if (timerRef.current) clearInterval(timerRef.current)
    }
    setAudioBlob(null)
    setRecorderState('idle')
    setRecordingDuration(0)
    setRecorderError('')
    chunksRef.current = []
  }, [recorderState])

  const saveAudioCapture = useCallback(async () => {
    if (!audioBlob) return
    setSaving(true)
    setSaveError('')
    setRecorderState('saving')

    try {
      const ext = audioBlob.type.includes('mp4') ? 'mp4' : audioBlob.type.includes('ogg') ? 'ogg' : 'webm'
      const form = new FormData()
      form.append('audio', audioBlob, `capture.${ext}`)
      form.append('project', project)
      form.append('urgency', urgency)
      form.append('tags', JSON.stringify(tags.split(',').map((t: string) => t.trim()).filter(Boolean)))

      const res = await fetch('/api/capture/audio', { method: 'POST', body: form })
      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        throw new Error(err.error ?? `Save failed: ${res.status}`)
      }

      await refreshCaptures()
      setAudioBlob(null)
      setRecordingDuration(0)
      setRecorderState('idle')
    } catch (err: unknown) {
      setSaveError((err as Error).message)
      setRecorderState('stopped')
    } finally {
      setSaving(false)
    }
  }, [audioBlob, project, urgency, tags, refreshCaptures])

  const saveTextCapture = useCallback(async () => {
    if (!content.trim() && !url.trim()) return
    setSaving(true)
    setSaveError('')

    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          type,
          source: url.trim() ? 'url' : 'manual_text',
          project,
          urgency,
          tags: tags.split(',').map((t: string) => t.trim()).filter(Boolean),
          ...(url.trim() ? { url: url.trim() } : {}),
        }),
      })

      if (!res.ok) {
        const err = (await res.json()) as { error: string }
        throw new Error(err.error ?? `Save failed: ${res.status}`)
      }

      await refreshCaptures()
      setContent('')
      setUrl('')
    } catch (err: unknown) {
      setSaveError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }, [content, type, project, urgency, tags, url, refreshCaptures])

  const handleAudioFileUpload = useCallback(
    async (file: File) => {
      setSaving(true)
      setSaveError('')
      try {
        const form = new FormData()
        form.append('audio', file)
        form.append('project', project)
        form.append('urgency', urgency)
        form.append('source', 'audio_upload')
        form.append('tags', JSON.stringify(tags.split(',').map((t: string) => t.trim()).filter(Boolean)))

        const res = await fetch('/api/capture/audio', { method: 'POST', body: form })
        if (!res.ok) {
          const err = (await res.json()) as { error: string }
          throw new Error(err.error ?? `Upload failed: ${res.status}`)
        }
        await refreshCaptures()
      } catch (err: unknown) {
        setSaveError((err as Error).message)
      } finally {
        setSaving(false)
      }
    },
    [project, urgency, tags, refreshCaptures],
  )

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const canSaveText = !!(content.trim() || url.trim())

  return (
    <div className="min-h-screen bg-surface-1 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-ink-0">Capture</h1>
          <p className="text-sm text-ink-3 mt-1">Did the thought survive?</p>
        </div>

        {/* ── Audio card ── */}
        <section className="card card-padded space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-ink-3 uppercase tracking-widest">Voice</h2>
            {(recorderState === 'recording' || recorderState === 'stopped') && (
              <span className="flex items-center gap-1.5 text-sm font-mono text-ink-2">
                {recorderState === 'recording' && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
                {fmt(recordingDuration)}
              </span>
            )}
          </div>

          {!micSupported ? (
            <p className="text-sm text-ink-3 bg-surface-2 rounded-lg px-4 py-3">
              Voice recording is not supported in this browser. Use text input or the file upload below.
            </p>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              {recorderState === 'idle' && (
                <>
                  <button
                    onClick={startRecording}
                    className="w-24 h-24 rounded-full bg-brain-600 hover:bg-brain-700 active:scale-95 transition-all shadow-lg flex items-center justify-center"
                    aria-label="Start recording"
                  >
                    <MicIcon className="w-10 h-10 text-white" />
                  </button>
                  <p className="text-xs text-ink-4">Tap to record</p>
                </>
              )}

              {recorderState === 'requesting' && (
                <div className="w-24 h-24 rounded-full bg-brain-50 border-2 border-brain-200 flex items-center justify-center">
                  <span className="text-xs text-brain-500 text-center px-2">Allow mic…</span>
                </div>
              )}

              {recorderState === 'recording' && (
                <>
                  <button
                    onClick={stopRecording}
                    className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all shadow-lg flex items-center justify-center"
                    aria-label="Stop recording"
                  >
                    <StopIcon className="w-10 h-10 text-white" />
                  </button>
                  <p className="text-xs text-ink-4">Tap to stop</p>
                </>
              )}

              {recorderState === 'stopped' && (
                <div className="flex flex-col items-center gap-3 w-full">
                  <p className="text-sm text-ink-2">Recording ready · {fmt(recordingDuration)}</p>
                  <div className="flex gap-3 w-full max-w-xs">
                    <button
                      onClick={saveAudioCapture}
                      disabled={saving}
                      className="btn btn-primary flex-1 py-3 text-base"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={discardRecording}
                      disabled={saving}
                      className="btn btn-secondary px-4 py-3 text-base"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {recorderState === 'saving' && (
                <div className="text-sm text-ink-3">Saving recording…</div>
              )}

              {recorderState === 'error' && (
                <>
                  <button
                    onClick={startRecording}
                    className="w-24 h-24 rounded-full bg-surface-2 hover:bg-surface-3 active:scale-95 transition-all flex items-center justify-center"
                    aria-label="Retry recording"
                  >
                    <MicIcon className="w-10 h-10 text-ink-3" />
                  </button>
                  <p className="text-xs text-ink-4">Tap to retry</p>
                </>
              )}
            </div>
          )}

          {recorderError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{recorderError}</p>
          )}

          {/* File upload fallback — always visible when mic is blocked, otherwise under error */}
          {(!micSupported || recorderState === 'error') && (
            <div className="border-t border-surface-3 pt-4">
              <label className="label text-xs">Upload audio file</label>
              <input
                type="file"
                accept="audio/*"
                disabled={saving}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    void handleAudioFileUpload(file)
                    e.target.value = ''
                  }
                }}
                className="input mt-1 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-brain-50 file:text-brain-700 file:cursor-pointer"
              />
            </div>
          )}
        </section>

        {/* ── Text / link card ── */}
        <section className="card card-padded space-y-3">
          <h2 className="text-xs font-semibold text-ink-3 uppercase tracking-widest">Text</h2>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="textarea w-full text-base"
            placeholder="Dump the thought before it evaporates…"
          />

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input w-full"
            placeholder="Paste a URL (optional)"
          />

          {/* Metadata toggle */}
          <button
            type="button"
            onClick={() => setMetaOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-ink-3 hover:text-ink-1 transition-colors"
          >
            <ChevronIcon
              className={clsx('w-3.5 h-3.5 transition-transform duration-150', metaOpen && 'rotate-180')}
            />
            {metaOpen ? 'Hide' : 'More'} options
          </button>

          {metaOpen && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Project</label>
                <input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="input"
                  placeholder="brain"
                />
              </div>

              <div>
                <label className="label text-xs">Urgency</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as CaptureUrgency)}
                  className="input"
                >
                  {URGENCY_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u.charAt(0).toUpperCase() + u.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label text-xs">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CaptureType)}
                  className="input"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label text-xs">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="input"
                  placeholder="tag1, tag2"
                />
              </div>
            </div>
          )}

          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{saveError}</p>
          )}

          <button
            type="button"
            onClick={saveTextCapture}
            disabled={saving || !canSaveText}
            className="btn btn-primary w-full py-3 text-base"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </section>

        {/* ── Recent captures ── */}
        {captures.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-ink-3 uppercase tracking-widest px-1">Recent</h2>
            <div className="space-y-2">
              {captures.map((c) => (
                <CaptureCard key={c.id} capture={c} />
              ))}
            </div>
          </section>
        )}

        {captures.length === 0 && (
          <p className="text-center text-sm text-ink-4 py-8">No captures yet. Start capturing above.</p>
        )}
      </div>
    </div>
  )
}

function CaptureCard({ capture }: { capture: DisplayCapture }) {
  const urgencyColor = {
    low: 'text-ink-4',
    normal: '',
    high: 'text-yellow-600',
    asap: 'text-red-600',
  }[capture.urgency]

  return (
    <div className="card card-padded space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="badge bg-surface-2 text-ink-2 capitalize">{capture.type}</span>
          {capture.hasAudio && (
            <span className="badge bg-brain-50 text-brain-700">
              <MicIcon className="w-3 h-3 mr-1" />
              audio
            </span>
          )}
          {capture.urgency !== 'normal' && (
            <span className={clsx('badge bg-surface-2', urgencyColor)}>{capture.urgency}</span>
          )}
        </div>
        <time className="text-xs text-ink-4 shrink-0 mt-0.5">
          {formatDistanceToNow(new Date(capture.createdAt), { addSuffix: true })}
        </time>
      </div>

      {capture.preview && (
        <p className="text-sm text-ink-1 leading-relaxed line-clamp-3">{capture.preview}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-ink-4">
        <span>{capture.project}</span>
        <span>·</span>
        <span>{capture.source.replace(/_/g, ' ')}</span>
        {capture.tags.length > 0 && (
          <>
            <span>·</span>
            <span>{capture.tags.join(', ')}</span>
          </>
        )}
      </div>
    </div>
  )
}

// ── Icons ──

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  )
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
