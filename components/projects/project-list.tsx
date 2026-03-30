'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'

export function ProjectList() {
  const [projects, setProjects] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  async function loadProjects() {
    try {
      const res = await fetch('/api/projects')
      setProjects(await res.json())
    } catch {}
  }

  useEffect(() => { loadProjects() }, [])

  async function handleCreate() {
    if (!newName.trim() || !newSlug.trim()) return
    setCreating(true)
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim(), description: newDesc.trim() }),
      })
      setShowCreate(false)
      setNewName('')
      setNewSlug('')
      setNewDesc('')
      loadProjects()
    } catch {
      alert('Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          + New Project
        </button>
      </div>

      {showCreate && (
        <div className="card-padded mb-6">
          <h3 className="section-title mb-4">Create Project</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Name</label>
              <input className="input" placeholder="My Project" value={newName}
                onChange={e => {
                  setNewName(e.target.value)
                  setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
                }} />
            </div>
            <div>
              <label className="label">Slug</label>
              <input className="input font-mono" placeholder="my-project" value={newSlug} onChange={e => setNewSlug(e.target.value)} />
            </div>
          </div>
          <div className="mb-4">
            <label className="label">Description</label>
            <textarea className="textarea h-20" placeholder="What is this project about?" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="card-padded text-center py-12">
          <p className="text-ink-3">No projects yet. Create your first project to organize your work.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(project => (
            <div key={project.slug} className="card-padded">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-base font-semibold text-ink-0">{project.name}</h3>
                  <p className="text-xs text-ink-3 font-mono">{project.slug}</p>
                </div>
                <span className={clsx('badge', project.status === 'active' ? 'badge-active' : 'badge-archived')}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-ink-2 mb-3">{project.description}</p>
              <div className="flex items-center gap-4 text-xs text-ink-3 pt-3 border-t border-surface-3">
                <span>{project.linked_agents?.length || 0} agents</span>
                <span>{project.modules?.length || 0} modules</span>
                <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
