import React, { useState, useEffect, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const PHASE_LABELS = { 1: 'Days 1–30', 2: 'Days 31–60', 3: 'Days 61–90' }
const PHASE_THEMES = { 1: 'Inform', 2: 'Optimize', 3: 'Operate' }
const PHASE_COLORS = { 1: 'var(--steel)', 2: 'var(--gold)', 3: 'var(--green)' }

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function OnboardingPlan({ projects }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('checklist')
  const [calView, setCalView] = useState('month')
  const [calDate, setCalDate] = useState(new Date())
  const [startDate, setStartDate] = useState('')
  const [showStartPrompt, setShowStartPrompt] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState({})
  const [newTaskText, setNewTaskText] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [dragTask, setDragTask] = useState(null)

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    try {
      const r = await fetch(`${API}/api/tasks`)
      const data = await r.json()
      if (data.success) {
        setTasks(data.data)
        // Show start date prompt if no due dates assigned yet
        const hasDates = data.data.some(t => t.due_date)
        if (!hasDates) setShowStartPrompt(true)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleAssignDates() {
    if (!startDate) return
    setAssigning(true)
    try {
      const r = await fetch(`${API}/api/tasks/assign-dates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_date: startDate }),
      })
      const data = await r.json()
      if (data.success) {
        setTasks(data.data)
        setShowStartPrompt(false)
        setCalDate(new Date(startDate))
        setView('calendar')
      }
    } catch (err) { console.error(err) }
    finally { setAssigning(false) }
  }

  async function toggleTask(task) {
    setSavingId(task.id)
    try {
      const r = await fetch(`${API}/api/tasks/${task.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      })
      const data = await r.json()
      if (data.success) setTasks(prev => prev.map(t => t.id === task.id ? data.data : t))
    } catch (err) { console.error(err) }
    finally { setSavingId(null) }
  }

  async function updateDueDate(taskId, due_date) {
    try {
      const r = await fetch(`${API}/api/tasks/${taskId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ due_date }),
      })
      const data = await r.json()
      if (data.success) setTasks(prev => prev.map(t => t.id === taskId ? data.data : t))
    } catch (err) { console.error(err) }
  }

  async function saveNote(taskId, notes) {
    try {
      const r = await fetch(`${API}/api/tasks/${taskId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      const data = await r.json()
      if (data.success) setTasks(prev => prev.map(t => t.id === taskId ? data.data : t))
    } catch (err) { console.error(err) }
  }

  async function addTask(phase, quarter) {
    const key = phase ? `phase-${phase}` : `quarter-${quarter}`
    const text = newTaskText[key]?.trim()
    if (!text) return
    try {
      const r = await fetch(`${API}/api/tasks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: phase || null, quarter: quarter || null, task: text }),
      })
      const data = await r.json()
      if (data.success) {
        setTasks(prev => [...prev, data.data])
        setNewTaskText(prev => ({ ...prev, [key]: '' }))
      }
    } catch (err) { console.error(err) }
  }

  async function deleteTask(id) {
    await fetch(`${API}/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  // Progress
  function phaseProgress(phaseTasks) {
    if (!phaseTasks.length) return 0
    return Math.round(phaseTasks.filter(t => t.completed).length / phaseTasks.length * 100)
  }

  function ProgressRing({ pct, color, size = 48 }) {
    const r2 = (size - 6) / 2
    const circ = 2 * Math.PI * r2
    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx={size/2} cy={size/2} r={r2} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={r2} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct/100)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.4s' }} />
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
          style={{ transform: `rotate(90deg) translate(0,0)`, transformOrigin: `${size/2}px ${size/2}px`, fontSize: 10, fontWeight: 700, fill: color, fontFamily: 'Inter' }}>
          {pct}%
        </text>
      </svg>
    )
  }

  function TaskRow({ task }) {
    const noteOpen = expandedNotes[task.id]
    const [noteVal, setNoteVal] = useState(task.notes || '')
    const noteTimer = useRef(null)

    function handleNoteChange(val) {
      setNoteVal(val)
      clearTimeout(noteTimer.current)
      noteTimer.current = setTimeout(() => saveNote(task.id, val), 800)
    }

    return (
      <div style={{ borderBottom: '1px solid var(--border2)', paddingBottom: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <button
            onClick={() => toggleTask(task)}
            disabled={savingId === task.id}
            style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${task.completed ? 'var(--green)' : 'var(--border2)'}`, background: task.completed ? 'var(--green)' : 'transparent', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, transition: 'all 0.2s' }}
          >
            {task.completed && <i className="ti ti-check" style={{ fontSize: 10, color: 'white' }} />}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: task.completed ? 'var(--muted)' : 'var(--text)', textDecoration: task.completed ? 'line-through' : 'none', lineHeight: 1.5 }}>
              {task.task}
            </div>
            {task.due_date && (
              <div style={{ fontSize: 10.5, color: task.completed ? 'var(--green)' : 'var(--amber)', marginTop: 2 }}>
                {task.completed ? '✓ Done' : '📅'} {formatDate(task.due_date)}
              </div>
            )}
          </div>
          <button onClick={() => setExpandedNotes(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.notes ? 'var(--gold)' : 'var(--muted)', padding: '2px 4px', fontSize: 12, flexShrink: 0 }}>
            <i className="ti ti-notes" />
          </button>
          {task.is_custom && (
            <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '2px 4px', fontSize: 11, flexShrink: 0 }}>
              <i className="ti ti-x" />
            </button>
          )}
        </div>
        {noteOpen && (
          <div style={{ marginLeft: 26, marginTop: 6 }}>
            <textarea value={noteVal} onChange={e => handleNoteChange(e.target.value)} placeholder="Add notes..."
              style={{ width: '100%', minHeight: 55, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border2)', borderRadius: 6, padding: '7px 10px', color: 'var(--text)', fontSize: 11.5, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'}
              onBlur={e => e.target.style.borderColor = 'var(--border2)'} />
          </div>
        )}
      </div>
    )
  }

  function PhaseColumn({ phase, quarter, tasks: colTasks, color, label, theme }) {
    const key = phase ? `phase-${phase}` : `quarter-${quarter}`
    const pct = phaseProgress(colTasks)
    return (
      <div style={{ flex: 1, minWidth: 240, background: 'var(--card)', border: 'var(--border2) solid 1px', borderRadius: 'var(--radius-lg)', padding: '16px 16px', borderTop: `3px solid ${color}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10.5, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
            {theme && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{theme}</div>}
          </div>
          <ProgressRing pct={pct} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          {colTasks.map(t => <TaskRow key={t.id} task={t} />)}
          {colTasks.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>No tasks yet</div>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="form-input" placeholder="Add task..." value={newTaskText[key] || ''}
            onChange={e => setNewTaskText(prev => ({ ...prev, [key]: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addTask(phase, quarter)}
            style={{ fontSize: 11.5, padding: '5px 10px' }} />
          <button className="btn btn-ghost btn-sm" onClick={() => addTask(phase, quarter)}><i className="ti ti-plus" /></button>
        </div>
      </div>
    )
  }

  // ── Calendar ──────────────────────────────────────────────────────────────
  function CalendarMonth() {
    const year = calDate.getFullYear()
    const month = calDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = Array.from({ length: 42 }, (_, i) => {
      const day = i - firstDay + 1
      return day >= 1 && day <= daysInMonth ? day : null
    })

    const tasksByDate = {}
    tasks.forEach(t => {
      if (t.due_date) {
        const d = new Date(t.due_date)
        if (d.getFullYear() === year && d.getMonth() === month) {
          const key = d.getDate()
          if (!tasksByDate[key]) tasksByDate[key] = []
          tasksByDate[key].push(t)
        }
      }
    })

    function handleDrop(e, day) {
      e.preventDefault()
      if (!dragTask || !day) return
      const due = new Date(year, month, day)
      updateDueDate(dragTask.id, due.toISOString().slice(0, 10))
      setDragTask(null)
    }

    const unscheduled = tasks.filter(t => !t.due_date && t.phase)

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setCalDate(new Date(year, month - 1, 1))}>← Prev</button>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setCalDate(new Date(year, month + 1, 1))}>Next →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', padding: '3px 0', fontWeight: 600 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((day, i) => {
            const dayTasks = day ? (tasksByDate[day] || []) : []
            const isToday = day && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year
            const hasOverdue = dayTasks.some(t => !t.completed)
            return (
              <div key={i}
                onDragOver={e => { e.preventDefault() }}
                onDrop={e => handleDrop(e, day)}
                style={{ minHeight: 80, background: day ? 'rgba(255,255,255,0.03)' : 'transparent', borderRadius: 6, padding: '4px 5px', border: isToday ? '1px solid var(--gold)' : hasOverdue ? '1px solid rgba(217,119,6,0.3)' : '1px solid transparent', transition: 'border-color 0.15s' }}
              >
                {day && <div style={{ fontSize: 10.5, color: isToday ? 'var(--gold)' : 'var(--muted)', fontWeight: isToday ? 700 : 400, marginBottom: 3 }}>{day}</div>}
                {dayTasks.map(t => {
                  const phaseColor = PHASE_COLORS[t.phase] || 'var(--muted)'
                  return (
                    <div key={t.id}
                      draggable
                      onDragStart={() => setDragTask(t)}
                      onClick={() => toggleTask(t)}
                      style={{ fontSize: 9.5, color: t.completed ? 'var(--green)' : 'var(--text)', textDecoration: t.completed ? 'line-through' : 'none', lineHeight: 1.4, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: `rgba(${t.phase === 1 ? '46,117,182' : t.phase === 2 ? '212,185,106' : '14,122,92'},0.12)`, borderLeft: `2px solid ${phaseColor}`, padding: '1px 4px', borderRadius: '0 3px 3px 0', cursor: 'grab' }}
                      title={`${t.task} — click to toggle, drag to reschedule`}
                    >
                      {t.task.slice(0, 28)}{t.task.length > 28 ? '…' : ''}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
        {unscheduled.length > 0 && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Unscheduled ({unscheduled.length}) — drag to calendar to assign date</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {unscheduled.map(t => (
                <div key={t.id} draggable onDragStart={() => setDragTask(t)}
                  style={{ fontSize: 11, color: 'var(--text)', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border2)', cursor: 'grab' }}>
                  {t.task.slice(0, 35)}{t.task.length > 35 ? '…' : ''}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  function CalendarWeek() {
    const startOfWeek = new Date(calDate)
    startOfWeek.setDate(calDate.getDate() - calDate.getDay())
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); return d
    })
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { const d = new Date(calDate); d.setDate(d.getDate()-7); setCalDate(d) }}>← Prev</button>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{days[0].toLocaleDateString('en-US',{month:'short',day:'numeric'})} – {days[6].toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => { const d = new Date(calDate); d.setDate(d.getDate()+7); setCalDate(d) }}>Next →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {days.map((day, i) => {
            const dayStr = day.toISOString().slice(0,10)
            const dayTasks = tasks.filter(t => t.due_date && t.due_date.slice(0,10) === dayStr)
            const isToday = day.toDateString() === new Date().toDateString()
            return (
              <div key={i}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (dragTask) { updateDueDate(dragTask.id, dayStr); setDragTask(null) } }}
                style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 8px', border: isToday ? '1px solid var(--gold)' : '1px solid var(--border2)', minHeight: 140 }}
              >
                <div style={{ fontSize: 11, color: isToday ? 'var(--gold)' : 'var(--muted)', fontWeight: isToday ? 700 : 400, marginBottom: 8 }}>
                  {day.toLocaleDateString('en-US',{weekday:'short'})} {day.getDate()}
                </div>
                {dayTasks.map(t => (
                  <div key={t.id} draggable onDragStart={() => setDragTask(t)} onClick={() => toggleTask(t)}
                    style={{ fontSize: 10, color: t.completed ? 'var(--green)' : 'var(--text)', textDecoration: t.completed ? 'line-through' : 'none', lineHeight: 1.5, marginBottom: 4, background: 'rgba(255,255,255,0.05)', padding: '3px 6px', borderRadius: 4, cursor: 'grab', borderLeft: `2px solid ${PHASE_COLORS[t.phase] || 'var(--muted)'}` }}>
                    {t.task.slice(0,40)}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function CalendarYear() {
    const year = calDate.getFullYear()
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthTasks = tasks.filter(t => {
        if (!t.due_date) return false
        const d = new Date(t.due_date)
        return d.getFullYear() === year && d.getMonth() === i
      })
      return { month: i, total: monthTasks.length, done: monthTasks.filter(t => t.completed).length }
    })
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setCalDate(new Date(year-1, 0, 1))}>← {year-1}</button>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{year}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setCalDate(new Date(year+1, 0, 1))}>{year+1} →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {months.map(m => {
            const name = new Date(year, m.month, 1).toLocaleDateString('en-US', { month: 'long' })
            const pct = m.total > 0 ? Math.round(m.done / m.total * 100) : 0
            return (
              <div key={m.month} onClick={() => { setCalDate(new Date(year, m.month, 1)); setCalView('month') }}
                style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '14px 14px', border: '1px solid var(--border2)', cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(212,185,106,0.4)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border2)'}
              >
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{name}</div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--green)', borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{m.done}/{m.total} tasks · {pct}%</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function CalendarDay() {
    const dayStr = calDate.toISOString().slice(0,10)
    const dayTasks = tasks.filter(t => t.due_date?.slice(0,10) === dayStr)
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { const d = new Date(calDate); d.setDate(d.getDate()-1); setCalDate(d) }}>← Prev</button>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{calDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => { const d = new Date(calDate); d.setDate(d.getDate()+1); setCalDate(d) }}>Next →</button>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 20, minHeight: 200 }}>
          {dayTasks.length > 0 ? dayTasks.map(t => (
            <div key={t.id} onClick={() => toggleTask(t)} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border2)', cursor: 'pointer', alignItems: 'flex-start' }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${t.completed ? 'var(--green)' : 'var(--border2)'}`, background: t.completed ? 'var(--green)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                {t.completed && <i className="ti ti-check" style={{ fontSize: 10, color: 'white' }} />}
              </div>
              <div>
                <div style={{ fontSize: 13.5, color: t.completed ? 'var(--muted)' : 'var(--text)', textDecoration: t.completed ? 'line-through' : 'none' }}>{t.task}</div>
                <div style={{ fontSize: 11, color: PHASE_COLORS[t.phase] || 'var(--muted)', marginTop: 3 }}>{PHASE_LABELS[t.phase] || 'Custom'} · {PHASE_THEMES[t.phase] || ''}</div>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: 13 }}>No tasks scheduled for this day</div>
          )}
        </div>
      </div>
    )
  }

  if (loading) return <div className="page"><div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Loading onboarding plan...</div></div>

  const totalCompleted = tasks.filter(t => t.completed).length
  const totalTasks = tasks.length
  const overallPct = totalTasks > 0 ? Math.round(totalCompleted / totalTasks * 100) : 0

  const phase1 = tasks.filter(t => t.phase === 1)
  const phase2 = tasks.filter(t => t.phase === 2)
  const phase3 = tasks.filter(t => t.phase === 3)
  const futureQuarters = [...new Set(tasks.filter(t => !t.phase).map(t => t.quarter || 'Q4'))]
  if (futureQuarters.length === 0) futureQuarters.push('Q4')

  return (
    <div className="page fade-in">
      {/* Start date prompt */}
      {showStartPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--gold)', borderRadius: 16, padding: '32px 36px', maxWidth: 420, width: '90%' }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Welcome to Your Onboarding Plan</div>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
              Enter your start date and I'll auto-assign all 30-60-90 day tasks to your calendar — most critical tasks first. You can drag tasks to reschedule anytime.
            </div>
            <div className="form-group">
              <label className="form-label">Your Start Date</label>
              <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setShowStartPrompt(false)}>Skip for now</button>
              <button className="btn btn-primary" onClick={handleAssignDates} disabled={!startDate || assigning}>
                {assigning ? 'Assigning...' : 'Assign Dates & Open Calendar →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>Your AI FinOps onboarding action plan — 30/60/90 days and beyond</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <div style={{ width: 240, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${overallPct}%`, background: 'var(--gold)', borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>{overallPct}%</span>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{totalCompleted}/{totalTasks} tasks</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowStartPrompt(true)} className="btn btn-ghost btn-sm"><i className="ti ti-calendar-plus" /> Set Start Date</button>
          <button onClick={() => setView('checklist')} className={`btn btn-sm ${view === 'checklist' ? 'btn-primary' : 'btn-ghost'}`}><i className="ti ti-list-check" /> Checklist</button>
          <button onClick={() => setView('calendar')} className={`btn btn-sm ${view === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}><i className="ti ti-calendar" /> Calendar</button>
        </div>
      </div>

      {/* Checklist view */}
      {view === 'checklist' && (
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, alignItems: 'flex-start' }}>
          <PhaseColumn phase={1} tasks={phase1} color={PHASE_COLORS[1]} label={PHASE_LABELS[1]} theme={PHASE_THEMES[1]} />
          <PhaseColumn phase={2} tasks={phase2} color={PHASE_COLORS[2]} label={PHASE_LABELS[2]} theme={PHASE_THEMES[2]} />
          <PhaseColumn phase={3} tasks={phase3} color={PHASE_COLORS[3]} label={PHASE_LABELS[3]} theme={PHASE_THEMES[3]} />
          {futureQuarters.map(q => (
            <PhaseColumn key={q} quarter={q} tasks={tasks.filter(t => !t.phase && (t.quarter||'Q4') === q)} color="var(--muted)" label={q} theme="Ongoing" />
          ))}
        </div>
      )}

      {/* Calendar view */}
      {view === 'calendar' && (
        <div className="card">
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['day','week','month','year'].map(v => (
              <button key={v} onClick={() => setCalView(v)} className={`btn btn-sm ${calView === v ? 'btn-primary' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>{v}</button>
            ))}
            <div style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--steel)', display: 'inline-block' }} /> 1-30
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--gold)', display: 'inline-block' }} /> 31-60
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--green)', display: 'inline-block' }} /> 61-90
            </div>
          </div>
          {calView === 'day'   && <CalendarDay />}
          {calView === 'week'  && <CalendarWeek />}
          {calView === 'month' && <CalendarMonth />}
          {calView === 'year'  && <CalendarYear />}
        </div>
      )}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
