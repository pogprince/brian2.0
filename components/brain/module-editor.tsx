'use client'

import { useState } from 'react'
import { clsx } from 'clsx'

interface Props {
  module: {
    path: string
    meta: Record<string, any>
    content: string
    raw: string
  }
  onSaved: () => void
}

export function ModuleEditor({ module, onSaved }: Props) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(module.content)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/brain/${module.path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, meta: module.meta }),
      })
      setEditing(false)
      onSaved()
    } catch {
      alert('Failed to save module')
    } finally {
      setSaving(false)
    }
  }

  // Reset content when module changes
  if (content !== module.content && !editing) {
    setContent(module.content)
  }

  const volatilityColor = (v?: string) => {
    if (v === 'low') return 'bg-green-100 text-green-800'
    if (v === 'medium') return 'bg-yellow-100 text-yellow-800'
    if (v === 'high') return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="px-5 py-4 border-b border-surface-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink-0">{module.meta.title || module.path}</h2>
            <p className="text-xs text-ink-3 font-mono mt-1">{module.path}</p>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button className="btn-secondary btn-sm" onClick={() => { setEditing(false); setContent(module.content) }}>Cancel</button>
                <button className="btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button className="btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
            )}
          </div>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {module.meta.type && (
            <span className="badge bg-surface-2 text-ink-2">Type: {module.meta.type}</span>
          )}
          {module.meta.salience !== undefined && (
            <span className="badge bg-brain-100 text-brain-800">Salience: {module.meta.salience}</span>
          )}
          {module.meta.volatility && (
            <span className={clsx('badge', volatilityColor(module.meta.volatility))}>
              Volatility: {module.meta.volatility}
            </span>
          )}
          {module.meta.last_updated && (
            <span className="badge bg-surface-2 text-ink-3">Updated: {module.meta.last_updated}</span>
          )}
          {module.meta.status && (
            <span className={clsx('badge', module.meta.status === 'active' ? 'badge-active' : 'badge-archived')}>
              {module.meta.status}
            </span>
          )}
        </div>

        {/* Related agents/projects */}
        {module.meta.related_agents?.length > 0 && (
          <div className="mt-2">
            <span className="text-[10px] text-ink-3 uppercase">Agents: </span>
            {module.meta.related_agents.map((a: string) => (
              <span key={a} className="text-xs text-brain-600 mr-2">{a}</span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {editing ? (
          <textarea
            className="textarea font-mono text-sm h-96"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        ) : (
          <div className="prose-brain">
            {module.content.split('\n').map((line, i) => {
              if (line.startsWith('# ')) return <h1 key={i}>{line.slice(2)}</h1>
              if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>
              if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>
              if (line.startsWith('- ')) return <li key={i}>{line.slice(2)}</li>
              if (line.startsWith('> ')) return <blockquote key={i}>{line.slice(2)}</blockquote>
              if (line.trim() === '') return <br key={i} />
              return <p key={i}>{line}</p>
            })}
          </div>
        )}
      </div>
    </div>
  )
}
