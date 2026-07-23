import React, { useState, useRef, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const LINE_HEIGHT = 24
const DEFAULT_W = 480
const DEFAULT_H = 420

function useDrag(headerRef, posRef, setPos) {
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return
    dragging.current = true
    offset.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [posRef])

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return
    const x = Math.max(0, Math.min(e.clientX - offset.current.x, window.innerWidth - DEFAULT_W))
    const y = Math.max(0, Math.min(e.clientY - offset.current.y, window.innerHeight - 60))
    setPos({ x, y }); posRef.current = { x, y }
  }, [posRef])

  const onPointerUp = useCallback(() => { dragging.current = false }, [])
  return { onPointerDown, onPointerMove, onPointerUp }
}

function useResize(sizeRef, setSize) {
  const resizing = useRef(false)
  const start = useRef({ x: 0, y: 0, w: 0, h: 0 })

  const onResizeDown = useCallback((e) => {
    e.stopPropagation()
    resizing.current = true
    start.current = { x: e.clientX, y: e.clientY, w: sizeRef.current.w, h: sizeRef.current.h }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [sizeRef])

  const onResizeMove = useCallback((e) => {
    if (!resizing.current) return
    const w = Math.max(320, start.current.w + (e.clientX - start.current.x))
    const h = Math.max(280, start.current.h + (e.clientY - start.current.y))
    setSize({ w, h }); sizeRef.current = { w, h }
  }, [sizeRef])

  const onResizeUp = useCallback(() => { resizing.current = false }, [])
  return { onResizeDown, onResizeMove, onResizeUp }
}

export default function FloatingNotepad({ open, onClose }) {
  const defaultPos = { x: window.innerWidth - DEFAULT_W - 24, y: 80 }
  const posRef = useRef(defaultPos)
  const sizeRef = useRef({ w: DEFAULT_W, h: DEFAULT_H })
  const [pos, setPos] = useState(defaultPos)
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H })
  const headerRef = useRef(null)
  const drag = useDrag(headerRef, posRef, setPos)
  const resize = useResize(sizeRef, setSize)

  const [notes, setNotes] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [body, setBody] = useState('')
  const [title, setTitle] = useState('')
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (open) loadNotes()
  }, [open])

  async function loadNotes() {
    try {
      const r = await fetch(`${API}/api/notes`)
      const data = await r.json()
      if (data.success) {
        setNotes(data.data)
        if (data.data.length > 0 && !activeNote) openNote(data.data[0])
      }
    } catch (err) { console.error(err) }
  }

  function openNote(note) {
    setActiveNote(note)
    setTitle(note.title || '')
    setBody(note.body || '')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function autoSave(noteId, newTitle, newBody) {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await fetch(`${API}/api/notes/${noteId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle, body: newBody }),
        })
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, title: newTitle, body: newBody } : n))
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
      } catch (err) { console.error(err) }
    }, 600)
  }

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
        body: JSON.stringify({ title: 'New Note', body: ' ' }),
      })
      const data = await r.json()
      if (data.success) {
        setNotes(prev => [data.data, ...prev])
        openNote(data.data)
      }
    } catch (err) { console.error(err) }
  }

  async function deleteNote(id) {
    await fetch(`${API}/api/notes/${id}`, { method: 'DELETE' })
    const remaining = notes.filter(n => n.id !== id)
    setNotes(remaining)
    if (activeNote?.id === id) {
      if (remaining.length > 0) openNote(remaining[0])
      else { setActiveNote(null); setBody(''); setTitle('') }
    }
  }

  if (!open) return null

  const lineCount = Math.max(20, body.split('\n').length + 3)
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1)

  return (
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y, width: size.w, height: size.h, zIndex: 600, display: 'flex', flexDirection: 'column', boxShadow: '0 16px 64px rgba(0,0,0,0.5)', borderRadius: 12, overflow: 'hidden', border: '1px solid #D4B96A', userSelect: 'none', fontFamily: "'Inter', system-ui, sans-serif" }}
      onPointerMove={e => { drag.onPointerMove(e); resize.onResizeMove(e) }}
      onPointerUp={e => { drag.onPointerUp(e); resize.onResizeUp(e) }}
    >
      {/* Green header */}
      <div
        ref={headerRef}
        {...drag}
        style={{ background: 'linear-gradient(135deg, #2D6A4F, #1B4332)', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'grab', flexShrink: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <i className="ti ti-notebook" style={{ fontSize: 14, color: '#D4B96A', flexShrink: 0 }} />
          <input
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Note title..."
            onPointerDown={e => e.stopPropagation()}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', flex: 1, minWidth: 0 }}
          />
          {saved && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>✓ saved</span>}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onPointerDown={e => e.stopPropagation()}>
          <button onClick={newNote} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#D4B96A', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>+ New</button>
          {activeNote && <button onClick={() => deleteNote(activeNote.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '3px 6px', fontSize: 13 }}><i className="ti ti-trash" /></button>}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: '3px 6px', fontSize: 15 }}><i className="ti ti-x" /></button>
        </div>
      </div>

      {/* Note tabs if multiple */}
      {notes.length > 1 && (
        <div style={{ display: 'flex', gap: 2, padding: '4px 8px', background: '#1B4332', overflowX: 'auto', flexShrink: 0 }} onPointerDown={e => e.stopPropagation()}>
          {notes.map(n => (
            <button key={n.id} onClick={() => openNote(n)}
              style={{ fontSize: 10.5, padding: '2px 10px', borderRadius: 4, background: activeNote?.id === n.id ? '#D4B96A' : 'rgba(255,255,255,0.08)', color: activeNote?.id === n.id ? '#1B4332' : 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: activeNote?.id === n.id ? 700 : 400 }}>
              {n.title?.slice(0, 16) || 'Untitled'}
            </button>
          ))}
        </div>
      )}

      {/* Lined paper */}
      <div style={{ flex: 1, display: 'flex', background: '#FFFEF5', overflow: 'hidden' }} onPointerDown={e => e.stopPropagation()}>
        {/* Line numbers */}
        <div style={{ width: 36, background: '#F5F0E0', borderRight: '1px solid #D4B96A', paddingTop: 10, flexShrink: 0, overflowY: 'hidden' }}>
          {lines.map(n => (
            <div key={n} style={{ height: LINE_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 7, fontSize: 9.5, color: '#B8A080', fontFamily: 'JetBrains Mono', userSelect: 'none' }}>
              {n}
            </div>
          ))}
        </div>

        {/* Writing area */}
        <div style={{ flex: 1, position: 'relative', paddingTop: 10, overflowY: 'auto' }}>
          {lines.map(n => (
            <div key={n} style={{ position: 'absolute', left: 0, right: 0, top: 10 + (n-1) * LINE_HEIGHT, height: 1, background: 'rgba(212,185,106,0.25)', pointerEvents: 'none' }} />
          ))}
          {activeNote ? (
            <textarea
              ref={textareaRef}
              value={body}
              onChange={e => handleBodyChange(e.target.value)}
              style={{ position: 'relative', zIndex: 1, width: '100%', height: lineCount * LINE_HEIGHT + 20, background: 'transparent', border: 'none', outline: 'none', padding: '0 14px', fontSize: 13.5, fontFamily: "'Georgia', serif", color: '#2D1B00', lineHeight: `${LINE_HEIGHT}px`, resize: 'none', letterSpacing: '0.01em' }}
              placeholder="Start writing..."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: '#B8A080' }}>
              <i className="ti ti-notebook" style={{ fontSize: 28, opacity: 0.4 }} />
              <div style={{ fontSize: 12 }}>Click + New to start a note</div>
            </div>
          )}
        </div>
      </div>

      {/* Resize handle */}
      <div
        onPointerDown={resize.onResizeDown}
        style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, cursor: 'se-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#D4B96A', borderRadius: '8px 0 0 0' }}
      >
        <i className="ti ti-arrows-diagonal" style={{ fontSize: 9, color: '#1B4332' }} />
      </div>

      {/* Footer */}
      <div style={{ background: '#F5F0E0', borderTop: '1px solid #D4B96A', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} onPointerDown={e => e.stopPropagation()}>
        <i className="ti ti-grip-horizontal" style={{ fontSize: 11, color: '#B8A080' }} />
        <span style={{ fontSize: 9.5, color: '#B8A080' }}>Drag to move · Resize from corner · FinOps Chatty reads your notes</span>
      </div>
    </div>
  )
}