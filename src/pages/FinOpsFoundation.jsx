import React, { useState } from 'react'

const PRINCIPLES = [
  {
    id: 'teams',
    icon: 'ti-users',
    color: 'var(--steel)',
    title: 'Teams Collaborate',
    finops: 'Finance, engineering, and product work together on cloud cost decisions.',
    studio: 'Every architecture decision in this studio is logged with owner, rationale, cost impact, and approval status — creating a shared record that finance, product, and engineering can all read and act on.',
    features: ['Decision records with owner attribution', 'Cost impact tracking per architecture choice', 'Approval workflows for model changes', 'Guardrail definitions visible to all stakeholders'],
  },
  {
    id: 'ownership',
    icon: 'ti-user-check',
    color: 'var(--gold)',
    title: 'Everyone Takes Ownership',
    finops: 'Engineers and product teams are accountable for the cost impact of their decisions.',
    studio: 'Cost efficiency ratings (A/B/C/D) are calculated from real service data and are visible on every project card. Every engineer who adds a service sees its monthly cost immediately — before it ships.',
    features: ['A/B/C/D cost efficiency ratings per project', 'Live cost calculation when adding services', 'Per-service cost breakdown in the Services tab', 'Guardrail breach notifications at the project level'],
  },
  {
    id: 'accessible',
    icon: 'ti-chart-bar',
    color: 'var(--green)',
    title: 'Accessible & Timely Reports',
    finops: 'Cost data must be visible, accurate, and current — not a month-end surprise.',
    studio: 'Weekly spend snapshots surface drift before it compounds. Leadership reports generate in one click from live data. FinOps Chatty answers cost questions in plain language, grounded only in your actual project data.',
    features: ['Weekly spend snapshots with drift detection', 'One-click leadership PowerPoint from live data', 'FinOps Chatty for plain-language cost queries', 'Dashboard KPIs updated on every data refresh'],
  },
  {
    id: 'centralized',
    icon: 'ti-building',
    color: '#8B5CF6',
    title: 'A Centralized Team Drives FinOps',
    finops: 'A dedicated FinOps function sets standards, educates teams, and enables best practices.',
    studio: 'This studio is the centralized governance layer for AI spend. It holds the model pricing table, guardrail definitions, rating thresholds, and architecture standards — one source of truth for the entire organization.',
    features: ['Centralized model pricing table (server-maintained)', 'Guardrail Definitions page as the governance standard', 'Architecture Review approval workflow', 'Scoring definitions accessible from every screen'],
  },
  {
    id: 'decisions',
    icon: 'ti-brain',
    color: 'var(--amber)',
    title: 'Decisions Driven by Business Value',
    finops: 'Cloud spending decisions should be tied to business outcomes, not just minimizing cost.',
    studio: 'Architecture reviews capture not just cost estimates but quality impact, risk level, and compliance requirements. The studio explicitly models the tradeoff between a cheaper model (Haiku) and higher quality (Sonnet) — and logs the decision with business rationale.',
    features: ['Quality impact tracking on every decision', 'Model tradeoff analysis in Architecture Review', 'Risk level scoring from guardrail state', 'ROI context in cost efficiency ratings'],
  },
  {
    id: 'variable',
    icon: 'ti-trending-up',
    color: 'var(--steel)',
    title: 'Take Advantage of the Variable Cost Model',
    finops: 'Cloud is pay-as-you-go — use that to your advantage with right-sizing and optimization.',
    studio: 'The studio surfaces optimization opportunities at every stage: caching recommendations reduce repeat token costs by 30-50%, RAG strategies reduce context size, and model right-sizing matches capability to task complexity without over-engineering.',
    features: ['Prompt caching recommendations in Architecture Review', 'RAG strategy guidance for context reduction', 'Scenario Planning for model downgrade analysis', 'Cost savings quantified per recommendation'],
  },
]

const CERTIFICATION = {
  title: 'FinOps for AI Certification Alignment',
  description: 'The FinOps Foundation\'s FinOps for AI certification extends FinOps principles specifically to AI/ML workloads — the fastest-growing and least-governed category of enterprise technology spend. AI FinOps Architecture Studio is built to embody these principles in every workflow.',
  phases: [
    {
      phase: 'INFORM',
      color: 'var(--steel)',
      description: 'Make AI cost data visible, accurate, and accessible to all stakeholders.',
      practices: ['Token-level cost visibility per service', 'Model spend breakdown', 'Budget vs forecast tracking', 'Weekly spend trend analysis', 'FinOps Chatty for plain-language queries'],
    },
    {
      phase: 'OPTIMIZE',
      color: 'var(--gold)',
      description: 'Continuously find opportunities to reduce AI spend without sacrificing quality.',
      practices: ['Architecture reviews before writing code', 'Low/Expected/High cost estimation', 'Model selection tradeoff analysis', 'Caching and RAG strategy recommendations', 'Deterministic vs. AI reasoning framework'],
    },
    {
      phase: 'OPERATE',
      color: 'var(--green)',
      description: 'Establish ongoing governance processes to sustain AI cost efficiency.',
      practices: ['9 guardrail types with automated alerting', 'Architecture decision records', 'Model change approval workflows', 'Cost efficiency ratings (A/B/C/D)', 'Executive leadership reports on demand'],
    },
  ],
}


// ── 30-60-90 Day Plan ─────────────────────────────────────────────────────────
const DAY_PLAN = [
  {
    period: '30 Days',
    color: 'var(--steel)',
    theme: 'Inform — Get Full Visibility',
    context: 'The FinOps for AI cert launched in March 2026. In your first 30 days, your job is to establish the single source of truth that every governance decision will depend on.',
    goals: [
      'Create a project in the Studio for every AI platform in scope — Cursor, Anthropic Console, Azure Foundry, Vertex AI, Braze, Genesys',
      'Add every AI service with model, daily call volume, and token usage — building the attribution map the JD requires',
      'Set guardrails on every platform: monthly spend ceiling, week-over-week drift, and cost per interaction',
      'Run the Architecture Review on each platform to document current state, risks, and model selection rationale',
      'Take your first weekly spend snapshot — this is Day 0 of your drift detection baseline',
      'Export your first Leadership Report and present it to Finance — establish the reporting cadence',
    ],
    studioFeatures: ['Projects', 'Services', 'Guardrails', 'Architecture Review', 'Snapshots', 'Leadership Reports'],
    certAlignment: 'INFORM phase — cost allocation, data ingestion, anomaly detection baseline',
    jdAlignment: 'End-to-end visibility · Source-level budgets · Platform owner assignment · Monthly close cadence',
  },
  {
    period: '60 Days',
    color: 'var(--gold)',
    theme: 'Optimize — Bend the Cost Curve',
    context: 'With full visibility established, the 60-day phase is about actively reducing cost without reducing value. This is where the FinOps cert OPTIMIZE phase comes to life — and where this role earns its authority.',
    goals: [
      'Run Scenario Planning on every project: model what 2×, 5×, 10× adoption growth does to spend before it happens',
      'Execute model routing policy: identify which workflows are using Opus/GPT-4o for tasks Haiku handles equally well',
      'Implement prompt caching on all eligible services — typically 30-50% input token reduction',
      'Build unit economics for every platform: cost per developer, cost per loan interaction, cost per accepted change',
      'Establish the idle seat reclamation process — weekly audit, not quarterly cleanup',
      'Define and enforce model change approval guardrail — gate access to high-cost models',
    ],
    studioFeatures: ['Scenario Planning', 'Unit Economics', 'Decisions Log', 'Guardrails — Model Change Approval', 'Forecasting'],
    certAlignment: 'OPTIMIZE phase — workload optimization, unit economics, rate optimization',
    jdAlignment: 'Model routing policy · Commitment strategy · Idle seat reclamation · Cost per workflow',
  },
  {
    period: '90 Days',
    color: 'var(--green)',
    theme: 'Operate — Govern at Scale',
    context: 'By 90 days, the governance framework is operational and self-sustaining. The FinOps cert OPERATE phase is about making these processes run without heroics — Finance is never surprised, leadership gets answers same day.',
    goals: [
      'Monthly AI spend close lands on time with variance explanations — every platform, every team',
      'Showback and chargeback are live: spend is attributable to team, business unit, model, and workflow',
      'Forecasting is tied to product-rollout milestones — not just run-rate extrapolation',
      'Architecture Reviews are the standard process for any new AI initiative before a dollar is spent',
      'FinOps Chatty is the on-demand answer for leadership: usage trends, model costs, guardrail status — same day',
      'The model routing policy has measurably bent the cost curve vs. uncontrolled baseline — document and present the delta',
    ],
    studioFeatures: ['Leadership Reports', 'Forecasting', 'Alerts', 'FinOps Chatty', 'Architecture Reviews', 'Unit Economics'],
    certAlignment: 'OPERATE phase — governance, education, assessment, invoicing, tools',
    jdAlignment: 'Monthly close · Showback/chargeback · On-demand reporting · Model policy enforcement',
  },
]

export default function FinOpsFoundation() {
  const [active, setActive] = useState(null)

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-sub">How AI FinOps Architecture Studio applies FinOps Foundation principles to AI/ML workloads</div>
      </div>

      {/* Certification alignment */}
      <div className="card" style={{ marginBottom: 28, border: '1px solid rgba(212,185,106,0.25)' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(212,185,106,0.12)', border: '1px solid rgba(212,185,106,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-certificate" style={{ fontSize: 22, color: 'var(--gold)' }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{CERTIFICATION.title}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{CERTIFICATION.description}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {CERTIFICATION.phases.map(ph => (
            <div key={ph.phase} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 10, padding: '16px 18px', borderTop: `3px solid ${ph.color}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: ph.color, letterSpacing: '0.12em', marginBottom: 8 }}>{ph.phase}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>{ph.description}</div>
              {ph.practices.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <i className="ti ti-check" style={{ fontSize: 12, color: ph.color, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: 'var(--text)' }}>{p}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Six principles */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
        The Six FinOps Principles — Applied to AI
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PRINCIPLES.map(p => (
          <div
            key={p.id}
            style={{ background: 'var(--card)', border: `1px solid ${active === p.id ? p.color : 'var(--border2)'}`, borderRadius: 'var(--radius)', overflow: 'hidden', transition: 'border-color 0.2s', cursor: 'pointer' }}
            onClick={() => setActive(active === p.id ? null : p.id)}
          >
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: `rgba(255,255,255,0.05)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`ti ${p.icon}`} style={{ fontSize: 18, color: p.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.finops}</div>
              </div>
              <i className={`ti ${active === p.id ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 16, color: 'var(--muted)', flexShrink: 0 }} />
            </div>

            {active === p.id && (
              <div style={{ padding: '0 20px 18px', borderTop: '1px solid var(--border2)' }} className="fade-in">
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: '14px 0 14px', paddingLeft: 52 }}>
                  {p.studio}
                </div>
                <div style={{ paddingLeft: 52, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {p.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <i className="ti ti-arrow-right" style={{ fontSize: 11, color: p.color, flexShrink: 0, marginTop: 3 }} />
                      <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Governing principle */}
      <div style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(212,185,106,0.06)', border: '1px solid rgba(212,185,106,0.2)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>Governing Principle</div>
        <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>
          Claude explains · Application calculates · Humans approve · Enterprise systems execute
        </div>
      </div>

      {/* 30-60-90 Day Plan */}
      <div style={{ marginTop: 32 }}>
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>30-60-90 Day Plan for AI FinOps Leaders</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
            How to apply FinOps for AI certification principles from day one at a new organization — using AI FinOps Architecture Studio as your operating system.
            The <span style={{ color: 'var(--gold)', fontWeight: 600 }}>FinOps Certified: FinOps for AI</span> exam launched March 2026. This plan maps the cert's Inform → Optimize → Operate framework to real actions in your first 90 days.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 20 }}>
          {DAY_PLAN.map((d, idx) => (
            <div key={d.period} style={{ background: 'var(--card)', border: `1px solid rgba(255,255,255,0.08)`, borderTop: `3px solid ${d.color}`, borderRadius: 'var(--radius-lg)', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700, color: d.color }}>{idx + 1}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: d.color }}>{d.period}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{d.theme}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{d.context}</div>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: d.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Key Actions</div>
                {d.goals.map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--navy)' }}>{i + 1}</span>
                    </div>
                    <span style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.5 }}>{g}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: d.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Studio Features Used</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {d.studioFeatures.map(f => (
                    <span key={f} style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', color: 'var(--muted)', padding: '2px 8px', borderRadius: 4 }}>{f}</span>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border2)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                  <span style={{ color: d.color, fontWeight: 600 }}>Cert: </span>{d.certAlignment}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                  <span style={{ color: d.color, fontWeight: 600 }}>JD: </span>{d.jdAlignment}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Success metrics */}
        <div style={{ marginTop: 20, padding: '18px 20px', background: 'rgba(14,122,92,0.06)', border: '1px solid rgba(14,122,92,0.2)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 10 }}>✓ What Success Looks Like at 90 Days</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {[
              'Every AI platform has source-level budgets, alerts, and a clear owner',
              'Monthly AI spend close lands on time — Finance and leadership are never surprised',
              'Spend is fully attributable to team, business unit, model, and workflow',
              'Model routing policy has measurably bent the cost curve vs. uncontrolled baseline',
              'Idle seat reclamation runs as a standing process, not a quarterly cleanup',
              'Leadership can get accurate AI usage and trend answers on demand, same day',
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <i className="ti ti-check" style={{ fontSize: 12, color: 'var(--green)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
