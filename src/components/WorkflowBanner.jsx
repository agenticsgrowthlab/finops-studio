import React, { useState, useRef, useEffect, useCallback } from 'react'

const STEPS = [
  {
    icon: 'ti-sparkles',
    title: 'Welcome to AI FinOps Architecture Studio',
    body: 'Govern AI spend before it becomes a problem. This guide walks you through creating a project, estimating costs, setting guardrails, and generating a leadership report — in about 5 minutes.',
    action: null,
    actionLabel: null,
    checklist: [
      'Architecture reviews before you spend money',
      'Real cost estimates from the pricing table',
      'Guardrails that fire before month-end',
      'One-click executive PowerPoint reports',
    ],
  },
  {
    icon: 'ti-plus',
    title: 'Step 1 — Create a Project',
    body: 'Click New Project in the left navigation. Choose New (designing from scratch) or Existing (already running). Give it a name, description, and annual AI budget.',
    action: 'new-project',
    actionLabel: 'Create New Project →',
    checklist: [
      'Choose Existing or New project type',
      'Enter a descriptive name and description',
      'Set an annual AI budget for variance tracking',
      'Click Create — persisted to Neon immediately',
    ],
  },
  {
    icon: 'ti-topology-star',
    title: 'Step 2 — Architecture Interview',
    body: 'Inside your project, open the Architecture Review tab. Answer 8 questions about your use case. The studio calculates Low/Expected/High cost estimates, then Claude generates your architecture summary.',
    action: null,
    actionLabel: null,
    checklist: [
      'Open your project → Architecture Review tab',
      'Answer all 8 questions (takes ~3 minutes)',
      'Review Low/Expected/High cost estimates',
      'Click Generate AI Summary & Save',
    ],
  },
  {
    icon: 'ti-database',
    title: 'Step 3 — Add Services & Guardrails',
    body: 'Add each AI service (model, calls/day, tokens) in the Services tab. Then configure guardrails in the Guardrails tab — spend ceilings, drift alerts, and model approvals protect your budget.',
    action: null,
    actionLabel: null,
    checklist: [
      'Services tab → Add Service for each AI workflow',
      'Cost calculated from server-maintained pricing table',
      'Guardrails tab → Add monthly ceiling and drift alert',
      'Cost efficiency rating (A/B/C/D) updates automatically',
    ],
  },
  {
    icon: 'ti-adjustments-horizontal',
    title: 'Step 4 — Scenario Planning',
    body: 'Before committing to growth or model changes, use Scenario Planning to see the financial impact. Model 2×, 5×, or 10× usage growth — or evaluate switching models — before spending a dollar.',
    action: 'scenario',
    actionLabel: 'Open Scenario Planning →',
    checklist: [
      'Select a project and set a usage multiplier',
      'See projected monthly and annual spend instantly',
      'Optionally model a model change (Haiku vs Sonnet)',
      'Budget impact turns red if forecast exceeds budget',
    ],
  },
  {
    icon: 'ti-presentation',
    title: 'Step 5 — Export Leadership Report',
    body: 'When you\'re ready to present, go to Leadership Reports and click Download PPT. A 5-slide navy/gold executive PowerPoint is generated from live data — no manual assembly, no stale numbers.',
    action: 'reports',
    actionLabel: 'View Leadership Reports →',
    checklist: [
      'Leadership Reports → Download PPT for any project',
      'Includes executive summary, architecture, cost analysis',
      'Decisions log and recommendations included',
      'Always current — generated from live Neon data',
    ],
  },
]

const PANEL_W = 380

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
    const maxX = window.innerWidth - PANEL_W - 12
    const maxY = window.innerHeight - 60 - 12
    const x = Math.max(12, Math.min(e.clientX - offset.current.x, maxX))
    const y = Math.max(12, Math.min(e.clientY - offset.current.y, maxY))
    setPos({ x, y })
    posRef.current = { x, y }
  }, [posRef])

  const onPointerUp = useCallback(() => { dragging.current = false }, [])

  return { onPointerDown, onPointerMove, onPointerUp }
}

export default function WorkflowBanner({ setPage }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('finops_guide_dismissed') === 'true' } catch { return false }
  })
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  const defaultPos = { x: Math.max(12, window.innerWidth - PANEL_W - 24), y: 80 }
  const posRef = useRef(defaultPos)
  const [pos, setPos] = useState(defaultPos)
  const headerRef = useRef(null)
  const drag = useDrag(headerRef, posRef, setPos)

  // Escape closes
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && open) setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function dismiss() {
    setDismissed(true)
    setOpen(false)
    try { localStorage.setItem('finops_guide_dismissed', 'true') } catch {}
  }

  function start() {
    setStep(0)
    setOpen(true)
  }

  function show() {
    setDismissed(false)
    try { localStorage.removeItem('finops_guide_dismissed') } catch {}
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  // ── Gold banner (slim, always visible unless dismissed) ──────────────────
  const banner = dismissed ? (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
      <button onClick={show} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
        <i className="ti ti-info-circle" style={{ fontSize: 13 }} /> Show getting started guide
      </button>
    </div>
  ) : (
    <div style={{
      background: 'linear-gradient(135deg, #F5EDD6 0%, #EFE0B0 100%)',
      border: '1px solid #D4B96A',
      borderLeft: 'none', borderRight: 'none',
      marginBottom: 0,
      marginLeft: -32, marginRight: -32, marginTop: -32,
      boxShadow: '0 1px 4px rgba(180,140,40,0.10)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', minHeight: 52, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(180,140,40,0.15)', border: '1px solid rgba(180,140,40,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-route" style={{ fontSize: 14, color: '#8A6A10' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#3D2E08' }}>Get started with AI FinOps Architecture Studio</span>
            <span style={{ fontSize: 12.5, color: '#6B520F', marginLeft: 8 }}>Follow the guided workflow to create your first project and export a leadership report.</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={start}
            style={{ padding: '7px 16px', background: '#0F2240', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', minHeight: 44 }}
          >
            <i className="ti ti-player-play" style={{ fontSize: 12 }} />
            Start Guided Tour
          </button>
          <button
            onClick={dismiss}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A6A10', padding: 8, display: 'flex', alignItems: 'center', opacity: 0.6, minWidth: 44, minHeight: 44, justifyContent: 'center' }}
          >
            <i className="ti ti-x" style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>
    </div>
  )

  // ── Floating guide panel ─────────────────────────────────────────────────
  const panel = open && (
    <div
      role="dialog"
      aria-label="AI FinOps Getting Started Guide"
      style={{ position: 'fixed', left: pos.x, top: pos.y, width: PANEL_W, zIndex: 500, background: '#fff', border: '1px solid #D4B96A', borderRadius: 14, boxShadow: '0 12px 48px rgba(0,0,0,0.18)', overflow: 'hidden', userSelect: 'none', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Drag header */}
      <div
        ref={headerRef}
        {...drag}
        style={{ background: 'linear-gradient(135deg, #0F2240 0%, #1A3A6B 100%)', padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'grab' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-route" style={{ fontSize: 14, color: '#D4B96A' }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#fff' }}>Getting Started Guide</span>
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>{step + 1} of {STEPS.length}</span>
        </div>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => setOpen(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: '6px 8px', fontSize: 15, display: 'flex', alignItems: 'center', minWidth: 32, minHeight: 32, justifyContent: 'center' }}
        >
          <i className="ti ti-x" />
        </button>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px 8px' }}>
        {STEPS.map((_, i) => {
          const done = i < step
          const active = i === step
          return (
            <React.Fragment key={i}>
              <button
                onClick={() => setStep(i)}
                style={{ width: active ? 10 : 8, height: active ? 10 : 8, borderRadius: '50%', background: done ? '#0E7A5C' : active ? '#0F2240' : '#E2E8F0', border: active ? '2px solid #0F2240' : done ? '2px solid #0E7A5C' : '2px solid #E2E8F0', cursor: 'pointer', padding: 0, transition: 'all 0.2s', flexShrink: 0 }}
              />
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: done ? '#0E7A5C' : '#E2E8F0', borderRadius: 1, transition: 'background 0.3s' }} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ padding: '8px 20px 20px', maxHeight: 480, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#F4F7FC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`ti ${current.icon}`} style={{ fontSize: 16, color: '#0F2240' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F2240', lineHeight: 1.3 }}>{current.title}</div>
        </div>

        <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, marginBottom: 14 }}>{current.body}</p>

        <div style={{ background: '#F4F7FC', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          {current.checklist.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 12.5, color: '#4A5568' }}>
              <i className="ti ti-check" style={{ color: '#0E7A5C', fontSize: 13, flexShrink: 0, marginTop: 2 }} />
              {item}
            </div>
          ))}
        </div>

        {current.action && (
          <button
            onClick={() => { setPage(current.action); setOpen(false) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '9px 16px', background: '#D4B96A', color: '#0F2240', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', justifyContent: 'center', marginBottom: 8 }}
          >
            <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
            {current.actionLabel}
          </button>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{ flex: 1, padding: '8px 14px', background: '#F4F7FC', color: '#4A5568', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: step === 0 ? 'not-allowed' : 'pointer', opacity: step === 0 ? 0.4 : 1, fontFamily: 'inherit' }}
          >
            ← Back
          </button>
          {isLast ? (
            <button
              onClick={dismiss}
              style={{ flex: 1, padding: '8px 14px', background: '#0F2240', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Got it ✓
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              style={{ flex: 1, padding: '8px 14px', background: '#0F2240', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Next →
            </button>
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #F1F5F9', padding: '8px 16px', fontSize: 11, color: '#718096', background: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-grip-horizontal" style={{ fontSize: 12, color: '#4A72A8' }} />
        Drag this panel to reposition · Press Esc to close
      </div>
    </div>
  )

  return { banner, panel }
}
