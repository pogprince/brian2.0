'use client'

import { useState } from 'react'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export function CreateAgentModal({ onClose, onCreated }: Props) {
  const [step, setStep] = useState<'prompt' | 'review'>('prompt')
  const [freeform, setFreeform] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [mode, setMode] = useState<'anon' | 'brain-bound'>('anon')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  async function handleGenerate() {
    if (!freeform.trim()) return
    // For MVP: parse the freeform input into agent fields
    // Extension point: use LLM to generate agent config from description
    const words = freeform.trim().split(/\s+/)
    const autoName = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Agent'
    setName(autoName)
    setDescription(freeform.trim())
    setSystemPrompt(`You are an AI assistant. ${freeform.trim()}`)
    setStep('review')
  }

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    try {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          mode,
          system_prompt: systemPrompt.trim(),
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })
      onCreated()
    } catch {
      alert('Failed to create agent')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-surface-3">
          <h2 className="text-lg font-bold text-ink-0">Create Agent</h2>
          <p className="text-sm text-ink-3 mt-1">
            {step === 'prompt' ? 'Describe what you want the agent to do' : 'Review and customize your agent'}
          </p>
        </div>

        <div className="p-6">
          {step === 'prompt' ? (
            <div>
              <textarea className="textarea h-32" placeholder="e.g., I need an agent that analyzes code reviews and suggests improvements..."
                value={freeform} onChange={e => setFreeform(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleGenerate() }} />
              <p className="text-xs text-ink-4 mt-2">Press Cmd+Enter or click Generate to create agent config</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="textarea h-20" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="label">Mode</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="mode" value="anon" checked={mode === 'anon'} onChange={() => setMode('anon')} className="accent-brain-600" />
                    <span className="text-sm">Anon (disposable)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="mode" value="brain-bound" checked={mode === 'brain-bound'} onChange={() => setMode('brain-bound')} className="accent-brain-600" />
                    <span className="text-sm">Brain-Bound (persistent)</span>
                  </label>
                </div>
              </div>

              <button className="text-sm text-brain-600 hover:text-brain-700" onClick={() => setShowAdvanced(!showAdvanced)}>
                {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-2 border-t border-surface-3">
                  <div>
                    <label className="label">System Prompt</label>
                    <textarea className="textarea h-24 font-mono text-xs" value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Tags (comma-separated)</label>
                    <input className="input" placeholder="research, analysis, coding" value={tags} onChange={e => setTags(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-surface-3 flex justify-end gap-3">
          <button className="btn-secondary" onClick={step === 'review' ? () => setStep('prompt') : onClose}>
            {step === 'review' ? 'Back' : 'Cancel'}
          </button>
          {step === 'prompt' ? (
            <button className="btn-primary" onClick={handleGenerate} disabled={!freeform.trim()}>Generate Agent</button>
          ) : (
            <button className="btn-primary" onClick={handleCreate} disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create Agent'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
