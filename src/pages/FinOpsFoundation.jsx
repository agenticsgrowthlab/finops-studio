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
    </div>
  )
}
