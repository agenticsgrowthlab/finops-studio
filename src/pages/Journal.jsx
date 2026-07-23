import React, { useState, useEffect, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const LINE_HEIGHT = 24
const LINES = 30

export default function Journal({ projects }) {
  const [tab, setTab] = useState('org')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [notes, setNotes] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [body, setBody] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef(null)
  const textareaRef = useRef(null)

  const projectId = tab === 'project' ? selectedProjectId : null

  useEffect(() => { loadNotes() }, [tab, selectedProjectId])

  async function loadNotes() {
    try {
      const url = projectId
        ? `${API}/api/notes?project_id=${projectId}`
        : `${API}/api/notes`
      const r = await fetch(url)
      const data = await r.json()
      if (data.success) {
        setNotes(data.data)
        if (data.data.length > 0 && !activeNote) {
          openNote(data.data[0])
        } else if (data.data.length === 0) {
          setActiveNote(null); setBody(''); setTitle('')
        }
      }
    } catch (err) { console.error(err) }
  }

  function openNote(note) {
    setActiveNote(note)
    setTitle(note.title || '')
    setBody(note.body || '')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const autoSave = useCallback(async (noteId, newTitle, newBody) => {
    if (!noteId) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch(`${API}/api/notes/${noteId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle, body: newBody }),
        })
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, title: newTitle, body: newBody } : n))
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
      } catch (err) { console.error(err) }
      finally { setSaving(false) }
    }, 600)
  }, [])

  function handleBodyChange(val) {
    setBody(val)
    if (activeNote) autoSave(activeNote.id, title, val)
  }

  function handleTitleChange(val) {
    setTitle(val)
    if (activeNote) autoSave(activeNote.id, val, body)
  }

  async function newNote() {
    try {
      const r = await fetch(`${API}/api/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId || null, title: 'New Note', body: '' }),
      })
      const data = await r.json()
      if (data.success) {
        setNotes(prev => [data.data, ...prev])
        openNote(data.data)
      }
    } catch (err) { console.error(err) }
  }

  async function deleteNote(id) {
    if (!confirm('Delete this note?')) return
    await fetch(`${API}/api/notes/${id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== id))
    if (activeNote?.id === id) { setActiveNote(null); setBody(''); setTitle('') }
  }

  // Line numbers
  const lineCount = Math.max(LINES, body.split('\n').length + 3)
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1)

  return (
    <div className="page fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 16 }}>Capture insights, tribal knowledge, and onboarding observations — Chatty reads your notes</div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <button onClick={() => setTab('org')} className={`btn btn-sm ${tab === 'org' ? 'btn-primary' : 'btn-ghost'}`}>
          <i className="ti ti-building" /> Org Journal
        </button>
        <button onClick={() => setTab('project')} className={`btn btn-sm ${tab === 'project' ? 'btn-primary' : 'btn-ghost'}`}>
          <i className="ti ti-folder" /> Project Notes
        </button>
        {tab === 'project' && (
          <select className="form-select" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={{ width: 240, padding: '6px 12px', fontSize: 12 }}>
            <option value="">— Select a project —</option>
            {[...projects].sort((a,b) => a.name.localeCompare(b.name)).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {saving && <span style={{ fontSize: 11, color: 'var(--muted)' }}>Saving...</span>}
          {saved && !saving && <span style={{ fontSize: 11, color: 'var(--green)' }}>✓ Saved</span>}
          <button onClick={newNote} className="btn btn-primary btn-sm">
            <i className="ti ti-plus" /> New Note
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        {/* Note list */}
        <div style={{ width: 220, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {notes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--muted)', fontSize: 12 }}>
              No notes yet.<br />Click New Note to start.
            </div>
          )}
          {notes.map(n => (
            <div
              key={n.id}
              onClick={() => openNote(n)}
              style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: activeNote?.id === n.id ? 'rgba(212,185,106,0.1)' : 'rgba(255,255,255,0.03)', border: activeNote?.id === n.id ? '1px solid rgba(212,185,106,0.3)' : '1px solid transparent', transition: 'all 0.15s' }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {n.title || 'Untitled'}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>
                {new Date(n.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                {n.body?.slice(0, 40) || '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Notepad */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {activeNote ? (
            <div style={{ flex: 1, background: '#FFFEF5', borderRadius: 12, overflow: 'hidden', border: '1px solid #D4B96A', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
              {/* Green header bar */}
              <div style={{ background: 'linear-gradient(135deg, #2D6A4F, #1B4332)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <input
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Note title..."
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', flex: 1 }}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                    {new Date(activeNote.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button onClick={() => deleteNote(activeNote.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 13, padding: '2px 4px' }}>
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </div>

              {/* Lined paper */}
              <div style={{ flex: 1, display: 'flex', overflowY: 'auto', background: '#FFFEF5' }}>
                {/* Line numbers */}
                <div style={{ width: 40, background: '#F5F0E0', borderRight: '1px solid #D4B96A', paddingTop: 12, flexShrink: 0 }}>
                  {lines.map(n => (
                    <div key={n} style={{ height: LINE_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, fontSize: 10, color: '#B8A080', fontFamily: 'JetBrains Mono', userSelect: 'none' }}>
                      {n}
                    </div>
                  ))}
                </div>

                {/* Writing area */}
                <div style={{ flex: 1, position: 'relative', paddingTop: 12 }}>
                  {/* Horizontal lines */}
                  {lines.map(n => (
                    <div key={n} style={{ position: 'absolute', left: 0, right: 0, top: 12 + (n-1) * LINE_HEIGHT, height: 1, background: 'rgba(212,185,106,0.25)' }} />
                  ))}
                  <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={e => handleBodyChange(e.target.value)}
                    style={{
                      position: 'relative', zIndex: 1,
                      width: '100%', height: lineCount * LINE_HEIGHT + 24,
                      background: 'transparent', border: 'none', outline: 'none',
                      padding: '0 16px', fontSize: 13.5,
                      fontFamily: "'Georgia', serif",
                      color: '#2D1B00', lineHeight: `${LINE_HEIGHT}px`,
                      resize: 'none', letterSpacing: '0.01em',
                    }}
                    placeholder="Start writing..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '2px dashed rgba(212,185,106,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <i className="ti ti-notebook" style={{ fontSize: 40, color: 'var(--gold)', opacity: 0.4 }} />
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>Select a note or create a new one</div>
              <button onClick={newNote} className="btn btn-primary btn-sm"><i className="ti ti-plus" /> New Note</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
