import React, { useState } from 'react'
import { RATING_DEFINITIONS, GUARDRAIL_TYPES } from '../data/demo.js'

export default function GuardrailDefinitions() {
  const [activeRating, setActiveRating] = useState('A')
  const active = RATING_DEFINITIONS.find(r => r.rating === activeRating)

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">Guardrail Definitions</div>
        <div className="page-sub">FinOps AI cost efficiency ratings, behaviors, and triggers — aligned with FinOps Foundation principles</div>
      </div>

      {/* Rating selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {RATING_DEFINITIONS.map(r => (
          <div key={r.rating}
            onClick={() => setActiveRating(r.rating)}
            style={{ cursor: 'pointer', padding: '20px 24px', borderRadius: 'var(--radius)', border: `2px solid ${activeRating === r.rating ? 'var(--gold)' : 'var(--border2)'}`, background: activeRating === r.rating ? 'rgba(212,185,106,0.08)' : 'var(--card)', transition: 'all 0.2s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className={`rating rating-${r.rating}`} style={{ width: 36, height: 36, fontSize: 18 }}>{r.rating}</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{r.label}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>ROI {r.roi}</div>
          </div>
        ))}
      </div>

      {/* Rating detail */}
      {active && (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
          <div className="card">
            <div className="card-title">Definition</div>
            <div style={{ fontSize: 14.5, color: 'var(--text)', marginBottom: 16, lineHeight: 1.7 }}>{active.description}</div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Trigger conditions</div>
              <div style={{ fontSize: 13, color: 'var(--text)' }}>{active.triggers}</div>
            </div>
            <div style={{ background: 'rgba(212,185,106,0.07)', border: '1px solid rgba(212,185,106,0.2)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Recommended action</div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{active.action}</div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">FinOps Behaviors at this Rating</div>
            {active.behaviors.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < active.behaviors.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                <i className="ti ti-check" style={{ color: active.color === 'green' ? 'var(--green)' : active.color === 'blue' ? 'var(--steel)' : active.color === 'amber' ? 'var(--amber)' : 'var(--red)', fontSize: 14, flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guardrail types */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 20 }}>Available Guardrail Types · {GUARDRAIL_TYPES.length} types</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {GUARDRAIL_TYPES.map(g => (
            <div key={g.id} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border2)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <i className={`ti ${g.icon}`} style={{ fontSize: 16, color: 'var(--gold)' }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>{g.label}</div>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 6 }}>{g.description}</div>
              {g.unit && <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--steel)' }}>Unit: {g.unit}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* FinOps principles */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">FinOps Foundation Principles Applied</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[
            { icon: 'ti-users', title: 'Teams Collaborate', body: 'Architecture, product, and finance work together on AI spend decisions. Every decision is logged and attributed.' },
            { icon: 'ti-eye', title: 'Everyone Takes Ownership', body: 'Guardrails are owned per-project. Engineers and PMs see cost impact of architecture decisions in real time.' },
            { icon: 'ti-trending-up', title: 'Accessible & Timely Reports', body: 'Weekly spend snapshots and leadership PPT exports make AI costs visible before month-end surprises.' },
            { icon: 'ti-brain', title: 'AI Assists — Humans Decide', body: 'This platform recommends; your team approves. Model changes require architecture review before taking effect.' },
          ].map(p => (
            <div key={p.title} style={{ display: 'flex', gap: 12 }}>
              <i className={`ti ${p.icon}`} style={{ fontSize: 20, color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>{p.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
