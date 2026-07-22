import React, { useState, useEffect, useCallback } from 'react'

const STEPS = [
  {
    step: '01',
    icon: 'ti-sparkles',
    title: 'Welcome to AI FinOps Architecture Studio',
    subtitle: 'Prevent AI spend surprises before they happen',
    body: 'Organizations adopting AI are flying blind on cost. Token spend grows silently, model choices go undocumented, and budget surprises arrive at month-end — too late to act. This studio gives you the governance framework to fix that.',
    cta: null,
    color: 'var(--gold)',
    highlight: 'FinOps Foundation aligned · Built for enterprise AI governance',
  },
  {
    step: '02',
    icon: 'ti-plus',
    title: 'Step 1 — Create Your Project',
    subtitle: 'New project or existing application',
    body: 'Start by creating a project. Choose Existing if you already have a running AI application, or New if you\'re designing one from scratch. Give it a name, description, and annual budget. This becomes your governance home base.',
    cta: { label: 'Create a Project →', page: 'new-project' },
    color: 'var(--steel)',
    highlight: 'Works for both new and existing AI applications',
  },
  {
    step: '03',
    icon: 'ti-topology-star',
    title: 'Step 2 — Architecture Interview',
    subtitle: 'Answer 8 questions, get your cost estimate and AI review',
    body: 'Inside your project, go to the Architecture Review tab. Answer 8 questions about purpose, users, frequency, context, quality, and compliance. The studio calculates Low/Expected/High cost estimates — then Claude generates an executive architecture summary grounded in your answers.',
    cta: null,
    color: '#8B5CF6',
    highlight: 'Deterministic math + Claude expertise = explainable estimates',
  },
  {
    step: '04',
    icon: 'ti-database',
    title: 'Step 3 — Add Services & Guardrails',
    subtitle: 'Track every AI service and protect your budget',
    body: 'Add each AI service in your project — specify the model, daily calls, and token usage. The studio calculates real cost from the pricing table. Then set guardrails: monthly spend ceilings, drift alerts, model approval lists. These fire before your bill arrives.',
    cta: null,
    color: 'var(--green)',
    highlight: '9 guardrail types · Alerts before month-end · Model change approval',
  },
  {
    step: '05',
    icon: 'ti-trending-up',
    title: 'Step 4 — Track, Govern & Ask Chatty',
    subtitle: 'Continuous oversight so nothing sneaks up on you',
    body: 'Take weekly spend snapshots to detect drift before it compounds. Log architecture decisions with rationale, cost impact, and approvals — creating a traceable record. Ask FinOps Chatty anything about your project and get answers grounded only in your real data.',
    cta: null,
    color: 'var(--amber)',
    highlight: 'FinOps Chatty never invents numbers — only explains facts from your data',
  },
  {
    step: '06',
    icon: 'ti-adjustments-horizontal',
    title: 'Step 5 — Scenario Planning',
    subtitle: 'Model the future before it happens',
    body: 'Use Scenario Planning to answer "what if" questions before committing. What if usage doubles? What if we switch from Sonnet to Haiku? What if we add caching? See projected monthly and annual spend instantly — so architecture decisions are made with financial clarity.',
    cta: { label: 'Open Scenario Planning →', page: 'scenario' },
    color: 'var(--steel)',
    highlight: 'Model growth, model changes, and cost optimizations before you commit',
  },
  {
    step: '07',
    icon: 'ti-presentation',
    title: 'Step 6 — Export Leadership Report',
    subtitle: 'One click to a board-ready executive PowerPoint',
    body: 'When you\'re ready to present, go to Leadership Reports and click Download PPT. Your report includes executive summary, architecture review, cost analysis, guardrail status, decisions log, and AI recommendations — all from live data. No manual slides. No stale numbers.',
    cta: { label: 'View Leadership Reports →', page: 'reports' },
    color: 'var(--gold)',
    highlight: 'Navy + gold design · Live data · Always current · Board-ready',
  },
]

export default function WorkflowBanner({ setPage }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('finops_banner_dismissed') === 'true' } catch { return false }
  })

  const advance = useCallback(() => {
    setCurrent(c => (c + 1) % STEPS.length)
  }, [])

  useEffect(() => {
    if (paused || dismissed) return
    const timer = setInterval(advance, 5500)
    return () => clearInterval(timer)
  }, [paused, dismissed, advance])

  function dismiss() {
    setDismissed(true)
    try { localStorage.setItem('finops_banner_dismissed', 'true') } catch {}
  }

  function show() {
    setDismissed(false)
    try { localStorage.removeItem('finops_banner_dismissed') } catch {}
  }

  if (dismissed) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={show} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-info-circle" style={{ fontSize: 14 }} /> Show getting started guide
        </button>
      </div>
    )
  }

  const step = STEPS[current]

  return (
    <div
      style={{
        background: 'var(--navy3)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 28,
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Gold top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${step.color}, transparent)`, transition: 'background 0.5s' }} />

      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
        <div style={{
          height: '100%',
          background: step.color,
          width: paused ? `${((current + 1) / STEPS.length) * 100}%` : `${((current + 1) / STEPS.length) * 100}%`,
          transition: 'width 0.3s ease',
          opacity: 0.6,
        }} />
      </div>

      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Icon */}
          <div style={{
            width: 52, height: 52, borderRadius: 12, flexShrink: 0,
            background: `rgba(${step.color === 'var(--gold)' ? '212,185,106' : step.color === 'var(--green)' ? '14,122,92' : step.color === 'var(--amber)' ? '217,119,6' : step.color === 'var(--steel)' ? '46,117,182' : '139,92,246'}, 0.15)`,
            border: `1px solid rgba(${step.color === 'var(--gold)' ? '212,185,106' : step.color === 'var(--green)' ? '14,122,92' : step.color === 'var(--amber)' ? '217,119,6' : step.color === 'var(--steel)' ? '46,117,182' : '139,92,246'}, 0.3)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.4s',
          }}>
            <i className={`ti ${step.icon}`} style={{ fontSize: 22, color: step.color, transition: 'color 0.4s' }} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: step.color, letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'color 0.4s' }}>
                {step.step} of {String(STEPS.length).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>·</span>
              <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{step.subtitle}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8, transition: 'all 0.3s' }}>
              {step.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 12, maxWidth: 680 }}>
              {step.body}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11.5, color: step.color, fontWeight: 600, opacity: 0.85, transition: 'color 0.4s' }}>
                ✦ {step.highlight}
              </span>
              {step.cta && (
                <button
                  onClick={() => setPage(step.cta.page)}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: 12 }}
                >
                  {step.cta.label}
                </button>
              )}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
            <button onClick={dismiss} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, padding: 4, lineHeight: 1 }} title="Dismiss">
              <i className="ti ti-x" />
            </button>
            <div style={{ display: 'flex', gap: 6 }}>
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  style={{
                    width: i === current ? 20 : 7,
                    height: 7,
                    borderRadius: 4,
                    background: i === current ? step.color : 'rgba(255,255,255,0.15)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.3s',
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setCurrent(c => (c - 1 + STEPS.length) % STEPS.length)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--muted)', cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="ti ti-chevron-left" style={{ fontSize: 13 }} />
              </button>
              <button
                onClick={advance}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--muted)', cursor: 'pointer', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
