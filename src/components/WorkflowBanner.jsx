import React, { useState, useRef, useEffect, useCallback } from 'react'

const STEPS = [
  {
    icon: 'ti-sparkles',
    title: 'Welcome to AI FinOps Architecture Studio',
    body: 'Govern AI spend before it becomes a problem. This guide walks you through creating a project, estimating costs, setting guardrails, and generating a leadership report — in about 5 minutes.',
    action: 'welcome',
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
    body: 'Click the button to create a new project. Choose New (designing from scratch) or Existing (already running). Give it a name, description, and annual AI budget — then click Create.',
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
    body: 'Now open the Architecture Review tab on your project. Answer 8 questions about your use case. The studio calculates Low/Expected/High cost estimates, then Claude generates your architecture summary.',
    action: 'arch-review',
    actionLabel: 'Go to Architecture Review →',
    checklist: [
      'Answer all 8 questions (takes ~3 minutes)',
      'Review Low/Expected/High cost estimates',
      'Click Generate AI Summary & Save',
      'Review is saved permanently to Neon',
    ],
  },
  {
    icon: 'ti-database',
    title: 'Step 3 — Add Services & Guardrails',
    body: 'Add each AI service (model, calls/day, tokens) in the Services tab. Then configure guardrails — spend ceilings, drift alerts, and model approvals protect your budget.',
    action: 'services',
    actionLabel: 'Go to Services Tab →',
    checklist: [
      'Add Service for each AI workflow in your project',
      'Cost calculated from server-maintained pricing table',
      'Add monthly ceiling and drift alert in Guardrails tab',
      'Cost efficiency rating (A/B/C/D) updates automatically',
    ],
  },
  {
    icon: 'ti-adjustments-horizontal',
    title: 'Step 4 — Scenario Planning',
    body: 'Before committing to growth or model changes, use Scenario Planning to see the financial impact. Model 2×, 5×, or 10× usage growth before spending a dollar.',
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
    body: 'Go to Leadership Reports and click Download PPT. A 5-slide navy/gold executive PowerPoint is generated from live data — no manual assembly, no stale numbers.',
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

export default function useWorkflowBanner({ setPage, activeProjectId, setActiveProjectId, projects }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('finops_guide_dismissed') === 'true' } catch { return false }
  })
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  // Smart navigation — goes to project tab when possible
  function handleAction(action) {
    if (action === 'arch-review') {
      if (activeProjectId) {
        setPage('project-detail')
        // Signal to ProjectDetail to open arch-review tab
        sessionStorage.setItem('finops_open_tab', 'arch-review')
      } else if (projects && projects.length > 0) {
        setActiveProjectId(projects[0].id)
        setPage('project-detail')
        sessionStorage.setItem('finops_open_tab', 'arch-review')
      }
    } else if (action === 'services') {
      if (activeProjectId) {
        setPage('project-detail')
        sessionStorage.setItem('finops_open_tab', 'services')
      } else if (projects && projects.length > 0) {
        setActiveProjectId(projects[0].id)
        setPage('project-detail')
        sessionStorage.setItem('finops_open_tab', 'services')
      }
    } else if (action !== 'welcome') {
      setPage(action)
    }
  }

  const defaultPos = { x: Math.max(12, window.innerWidth - PANEL_W - 24), y: 80 }
  const posRef = useRef(defaultPos)
  const [pos, setPos] = useState(defaultPos)
  const headerRef = useRef(null)
  const drag = useDrag(headerRef, posRef, setPos)

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

  function show() {
    setDismissed(false)
    try { localStorage.removeItem('finops_guide_dismissed') } catch {}
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  // ── Gold slim banner — shows on ALL pages while guide is active ────────────
  const banner = dismissed ? (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 32px 0', background: 'transparent' }}>
      <button onClick={show} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 5 }}>
        <i className="ti ti-info-circle" style={{ fontSize: 13 }} /> Show getting started guide
      </button>
    </div>
  ) : (
    <div style={{
      background: 'linear-gradient(135deg, #F5EDD6 0%, #EFE0B0 100%)',
      borderBottom: '1px solid #D4B96A',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', minHeight: 52, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(180,140,40,0.2)', border: '1px solid rgba(180,140,40,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-route" style={{ fontSize: 14, color: '#5C3D00' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#3D2E08' }}>
              {open ? `Getting Started · Step ${step + 1} of ${STEPS.length}: ${current.title}` : 'Get started with AI FinOps Architecture Studio'}
            </span>
            {!open && (
              <span style={{ fontSize: 12.5, color: '#6B4F10', marginLeft: 8 }}>
                Follow the guided workflow to create your first project and export a leadership report.
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {open ? (
            <>
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.08)', color: '#3D2E08', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: step === 0 ? 'not-allowed' : 'pointer', opacity: step === 0 ? 0.4 : 1, fontFamily: 'inherit', minHeight: 36 }}
              >
                ← Back
              </button>
              {current.action && current.actionLabel && (
                <button
                  onClick={() => handleAction(current.action)}
                  style={{ padding: '6px 14px', background: '#0F2240', color: '#D4B96A', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 36 }}
                >
                  {current.actionLabel}
                </button>
              )}
              {isLast ? (
                <button
                  onClick={dismiss}
                  style={{ padding: '6px 14px', background: '#0F2240', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 36 }}
                >
                  Got it ✓
                </button>
              ) : (
                <button
                  onClick={() => setStep(s => s + 1)}
                  style={{ padding: '6px 14px', background: '#0F2240', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 36 }}
                >
                  Next →
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A6A10', padding: 8, display: 'flex', alignItems: 'center', opacity: 0.7, minWidth: 36, minHeight: 36, justifyContent: 'center' }}
                title="Close guide"
              >
                <i className="ti ti-chevron-up" style={{ fontSize: 16 }} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setOpen(true)}
                style={{ padding: '7px 16px', background: '#0F2240', color: '#D4B96A', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', minHeight: 44 }}
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
            </>
          )}
        </div>
      </div>

      {/* Expanded step detail — inline in the banner */}
      {open && (
        <div style={{ padding: '0 32px 16px', borderTop: '1px solid rgba(180,140,40,0.2)' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', paddingTop: 14 }}>
            {/* Step dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, paddingTop: 3 }}>
              {STEPS.map((_, i) => {
                const done = i < step
                const active = i === step
                return (
                  <React.Fragment key={i}>
                    <button
                      onClick={() => setStep(i)}
                      style={{ width: active ? 10 : 7, height: active ? 10 : 7, borderRadius: '50%', background: done ? '#0E7A5C' : active ? '#3D2E08' : 'rgba(61,46,8,0.25)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s', flexShrink: 0 }}
                    />
                    {i < STEPS.length - 1 && (
                      <div style={{ width: 20, height: 2, background: done ? '#0E7A5C' : 'rgba(61,46,8,0.2)', borderRadius: 1 }} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>

            {/* Step body */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, color: '#4A3200', lineHeight: 1.7, margin: 0 }}>{current.body}</p>
            </div>

            {/* Checklist */}
            <div style={{ width: 340, flexShrink: 0 }}>
              {current.checklist.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                  <i className="ti ti-check" style={{ fontSize: 12, color: '#0E7A5C', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: '#4A3200', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return { banner, panel: null }
}
