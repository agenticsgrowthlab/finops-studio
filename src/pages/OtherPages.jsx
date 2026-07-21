import React, { useState } from 'react'
import { monthlySpend, formatCost, MODELS } from '../data/demo.js'

export function ArchReviews({ projects }) {
  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">Architecture Reviews</div>
        <div className="page-sub">Formal AI architecture assessments — deterministic vs. reasoning, model selection, and approval status</div>
      </div>
      {projects.filter(p => p.type === 'new').length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No architecture reviews yet</div>
          <div className="empty-state-sub">Architecture reviews are generated when you create a new project. Start a new project to get a full review including model recommendations, spend estimates, and risk assessment.</div>
        </div>
      ) : (
        projects.filter(p => p.type === 'new').map(p => (
          <div key={p.id} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{p.description}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'var(--green-bg)', color: '#34D399' }}>Approved</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Architecture Score</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: p.arch_score >= 80 ? 'var(--green)' : 'var(--amber)' }}>{p.arch_score}/100</div>
              </div>
              <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Monthly Forecast</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{formatCost(monthlySpend(p))}</div>
              </div>
              <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Cost Rating</div>
                <span className={`rating rating-${p.cost_score}`} style={{ width: 32, height: 32, fontSize: 16 }}>{p.cost_score}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export function ScenarioPlanning({ projects }) {
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '')
  const [multiplier, setMultiplier] = useState(2)
  const [model, setModel] = useState('')

  const project = projects.find(p => p.id === selectedProject)
  const baseSpend = project ? monthlySpend(project) : 0
  const scenarioSpend = baseSpend * multiplier
  const modelScenario = MODELS.find(m => m.id === model)

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">Scenario Planning</div>
        <div className="page-sub">Model what happens to AI spend under different growth, usage, or architecture scenarios</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">Scenario Inputs</div>
            <div className="form-group">
              <label className="form-label">Project</label>
              <select className="form-select" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Usage Growth Multiplier</label>
              <input className="form-input" type="range" min="0.5" max="10" step="0.5" value={multiplier} onChange={e => setMultiplier(Number(e.target.value))} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>0.5×</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: 'var(--gold)', fontWeight: 700 }}>{multiplier}× current usage</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>10×</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Model Change (optional)</label>
              <select className="form-select" value={model} onChange={e => setModel(e.target.value)}>
                <option value="">— Keep current models —</option>
                {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">Scenario Output</div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Current Monthly Spend</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 28, color: 'var(--muted)', fontWeight: 600 }}>{formatCost(baseSpend)}</div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Projected Monthly Spend</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 32, color: scenarioSpend > baseSpend * 3 ? 'var(--red)' : scenarioSpend > baseSpend * 1.5 ? 'var(--amber)' : 'var(--green)', fontWeight: 700 }}>{formatCost(scenarioSpend)}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 4 }}>Annual Projection</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18, color: 'var(--gold)', fontWeight: 700 }}>{formatCost(scenarioSpend * 12)}</div>
              </div>
              <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 4 }}>Budget Impact</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 700, color: scenarioSpend * 12 > (project?.budget_annual || 0) ? 'var(--red)' : 'var(--green)' }}>
                  {project ? (((scenarioSpend * 12 - project.budget_annual) / project.budget_annual) * 100).toFixed(0) : 0}%
                </div>
              </div>
            </div>
          </div>

          {modelScenario && (
            <div className="card">
              <div className="card-title">Model Change Impact</div>
              <div className="model-card recommended">
                <div className="model-name">{modelScenario.name}</div>
                <div className="model-cost">${modelScenario.costPer1MIn}/M in · ${modelScenario.costPer1MOut}/M out</div>
                <div>{modelScenario.strengths.map(s => <span key={s} className="model-tag tag-strength">{s}</span>)}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>{modelScenario.bestFor}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function LeadershipReports({ projects }) {
  const totalMonthly = projects.reduce((s, p) => s + monthlySpend(p), 0)
  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Leadership Reports</div>
          <div className="page-sub">Executive-ready reports generated from live project data</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {[
          { icon: 'ti-presentation', title: 'AI FinOps Executive Summary', desc: 'Total spend, efficiency ratings, open alerts, top recommendations across all projects.', tag: 'All Projects' },
          ...projects.map(p => ({
            icon: 'ti-chart-bar',
            title: `${p.name} — Project Report`,
            desc: `Monthly run rate, guardrail status, architecture score, decisions log, and recommendations.`,
            tag: p.name,
          })),
        ].map((r, i) => (
          <div key={i} className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s', border: '1px solid var(--border2)' }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(212,185,106,0.4)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border2)'}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
              <i className={`ti ${r.icon}`} style={{ fontSize: 24, color: 'var(--gold)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>{r.desc}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4 }}>{r.tag}</span>
              <button className="btn btn-primary btn-sm"><i className="ti ti-download" /> Download PPT</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-title">Report Preview · AI FinOps Executive Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total Monthly Spend', value: formatCost(totalMonthly), sub: 'Across all projects' },
            { label: 'Annual Forecast', value: formatCost(totalMonthly * 12), sub: 'At current run rate' },
            { label: 'Active Projects', value: String(projects.length), sub: 'Agentics Growth Lab' },
            { label: 'Open Alerts', value: String(projects.reduce((s, p) => s + (p.alerts || []).length, 0)), sub: 'Require attention' },
          ].map(s => (
            <div key={s.label} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border2)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 22, color: 'var(--gold)', fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', fontStyle: 'italic' }}>Full PPT includes: spend trends, per-project breakdown, guardrail status, architecture scores, open alerts, and top recommendations.</div>
      </div>
    </div>
  )
}

export function Settings() {
  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">Settings</div>
        <div className="page-sub">Organization and platform configuration</div>
      </div>
      <div style={{ maxWidth: 560 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Organization</div>
          <div className="form-group">
            <label className="form-label">Organization Name</label>
            <input className="form-input" value="Agentics Growth Lab" readOnly style={{ opacity: 0.7 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Plan</label>
            <input className="form-input" value="Enterprise (Single Tenant)" readOnly style={{ opacity: 0.7 }} />
          </div>
        </div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">AI Configuration</div>
          <div className="form-group">
            <label className="form-label">Anthropic API Key</label>
            <input className="form-input" type="password" placeholder="sk-ant-..." />
            <div className="form-hint">Used for AI-generated architecture reviews and recommendations.</div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Notifications</div>
          {['Email alerts when guardrails are breached', 'Weekly spend summary', 'Monthly budget forecast'].map(n => (
            <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border2)' }}>
              <span style={{ fontSize: 13 }}>{n}</span>
              <div style={{ width: 36, height: 20, background: 'var(--green)', borderRadius: 10, cursor: 'pointer', position: 'relative' }}>
                <div style={{ width: 16, height: 16, background: '#fff', borderRadius: 8, position: 'absolute', top: 2, right: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
