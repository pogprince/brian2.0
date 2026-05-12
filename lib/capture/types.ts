export type CaptureType =
  | 'idea'
  | 'task'
  | 'link'
  | 'quote'
  | 'transcript'
  | 'observation'
  | 'file'
  | 'audio'

export type CaptureSource =
  | 'manual_text'
  | 'mobile_voice'
  | 'audio_upload'
  | 'url'
  | 'file_upload'
  | 'imported'

export type CaptureStatus = 'inbox' | 'triaged' | 'archived'

export type CaptureUrgency = 'low' | 'normal' | 'high' | 'asap'

export type TranscriptStatus = 'none' | 'pending' | 'done' | 'failed'

export interface CaptureMeta {
  id: string
  createdAt: string
  updatedAt: string
  status: CaptureStatus
  source: CaptureSource
  type: CaptureType
  project: string
  urgency: CaptureUrgency
  tags: string[]
  hasAudio: boolean
  audioPath?: string
  transcriptStatus?: TranscriptStatus
  url?: string
  fileRefs?: string[]
}

export interface Capture extends CaptureMeta {
  content: string
  filePath: string
}

export interface CaptureCreateInput {
  id?: string
  content: string
  type?: CaptureType
  source?: CaptureSource
  project?: string
  urgency?: CaptureUrgency
  tags?: string[]
  url?: string
  fileRefs?: string[]
  audioPath?: string
  transcriptStatus?: TranscriptStatus
}

export interface CaptureListItem extends CaptureMeta {
  preview: string
  filePath: string
}
