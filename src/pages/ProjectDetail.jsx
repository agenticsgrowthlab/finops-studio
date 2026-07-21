import React, { useState } from 'react'
import { GUARDRAIL_TYPES, MODELS, monthlySpend, formatCost } from '../data/demo.js'

function OverviewTab({ project }) {
  const spend = monthlySpend(project)
  const budget = (project.budget_annual || 0) / 12
  const forecast = spend * 12
  const variance = project.budget_annual > 0 ? ((forecast - project.budget_annual) / project.budget_annual * 100) : 0

  return (
    <div className="fade-in">
      <div className="stat-grid stat-grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Monthly Run Rate</div>
          <div className="stat-value">{formatCost(spend)}</div>
          <div className="stat-sub">Budget {formatCost(budget)}/mo</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Annual Forecast</div>
          <div className="stat-value">{formatCost(forecast)}</div>
          <div className="stat-sub" style={{ color: variance > 0 ? 'var(--amber)' : 'var(--green)' }}>
            {variance > 0 ? '↑' : '↓'} {Math.abs(variance).toFixed(1)}% vs budget
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Architecture Score</div>
          <div className="stat-value" style={{ fontSize: 32, color: project.arch_score >= 80 ? 'var(--green)' : project.arch_score >= 60 ? 'var(--amber)' : 'var(--red)' }}>{project.arch_score}</div>
          <div className="stat-sub">/ 100</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cost Efficiency</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 4px' }}>
            <span className={`rating rating-${project.cost_score}`} style={{ width: 36, height: 36, fontSize: 18 }}>{project.cost_score}</span>
            <span className={`risk risk-${project.risk_level}`}><span className="dot" />{project.risk_level} risk</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Spend trend */}
        <div className="card">
          <div className="card-title">Spend Trend · Last 5 Weeks</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80, marginBottom: 8 }}>
            {(project.snapshots || []).slice().reverse().map((s, i) => {
              const max = Math.max(...(project.snapshots || []).map(x => x.spend))
              const h = max > 0 ? (s.spend / max) * 70 : 0
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>{formatCost(s.spend)}</div>
                  <div style={{ width: '100%', height: h, background: 'var(--gold)', borderRadius: '3px 3px 0 0', opacity: i === (project.snapshots || []).length - 1 ? 1 : 0.5 }} />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {(project.snapshots || []).slice().reverse().map((s, i) => (
              <span key={i} style={{ flex: 1, fontSize: 9.5, color: 'var(--muted)', textAlign: 'center' }}>{s.week}</span>
            ))}
          </div>
        </div>

        {/* Guardrail status */}
        <div className="card">
          <div className="card-title">Guardrail Status</div>
          {(project.guardrails || []).length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No guardrails configured</div>
          ) : (
            (project.guardrails || []).map(g => {
              const def = GUARDRAIL_TYPES.find(t => t.id === g.type)
              return (
                <div key={g.id} className="guardrail-item">
                  <span className={`guardrail-status guardrail-${g.status}`} />
                  <span className="guardrail-name">{def?.label || g.type}</span>
                  {g.threshold && <span className="guardrail-threshold">{g.current !== null ? `${g.current} / ` : ''}{g.threshold}{def?.unit ? ' ' + def.unit : ''}</span>}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Recommendations */}
      {(project.recommendations || []).length > 0 && (
        <div className="card">
          <div className="card-title">AI Recommendations</div>
          {project.recommendations.map(r => (
            <div key={r.id} className="rec-card">
              <i className="ti ti-bulb rec-icon" style={{ color: 'var(--gold)' }} />
              <div>
                <div className="rec-title">{r.title}</div>
                <div className="rec-body">{r.body}</div>
                <span className={`rec-priority rec-${r.priority}`}>{r.priority} priority</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ServicesTab({ project, addService }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', model: 'claude-haiku-4-5', calls_day: '', prompt_tokens: '', completion_tokens: '', caching_enabled: false })

  const estimated = () => {
    const model = MODELS.find(m => m.id === form.model)
    if (!model || !form.calls_day || !form.prompt_tokens || !form.completion_tokens) return null
    const monthlyIn = (Number(form.calls_day) * 30 * Number(form.prompt_tokens)) / 1_000_000 * model.costPer1MIn
    const monthlyOut = (Number(form.calls_day) * 30 * Number(form.completion_tokens)) / 1_000_000 * model.costPer1MOut
    return (monthlyIn + monthlyOut).toFixed(2)
  }

  const rating = (cost) => {
    if (!cost) return 'B'
    if (cost < 20) return 'A'
    if (cost < 50) return 'B'
    if (cost < 100) return 'C'
    return 'D'
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>{(project.services || []).length} services · {formatCost(monthlySpend(project))}/month total</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <i className={`ti ${showForm ? 'ti-x' : 'ti-plus'}`} /> {showForm ? 'Cancel' : 'Add Service'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(212,185,106,0.3)' }}>
          <div className="card-title">New AI Service</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Service Name</label>
              <input className="form-input" placeholder="e.g. Email Draft Generation" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <select className="form-select" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))}>
                {MODELS.map(m => <option key={m.id} value={m.id}>{m.name} — ${m.costPer1MIn}/M in · ${m.costPer1MOut}/M out</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Calls Per Day</label>
              <input className="form-input" type="number" placeholder="50" value={form.calls_day} onChange={e => setForm(p => ({ ...p, calls_day: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Prompt Tokens (avg)</label>
              <input className="form-input" type="number" placeholder="800" value={form.prompt_tokens} onChange={e => setForm(p => ({ ...p, prompt_tokens: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Completion Tokens (avg)</label>
              <input className="form-input" type="number" placeholder="400" value={form.completion_tokens} onChange={e => setForm(p => ({ ...p, completion_tokens: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Caching Enabled</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <input type="checkbox" checked={form.caching_enabled} onChange={e => setForm(p => ({ ...p, caching_enabled: e.target.checked }))} />
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Enable prompt caching</span>
              </div>
            </div>
          </div>

          {estimated() && (
            <div style={{ background: 'rgba(212,185,106,0.07)', border: '1px solid rgba(212,185,106,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 20 }}>
              <div><div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Est. Monthly Cost</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 22, color: 'var(--gold)', fontWeight: 700 }}>${estimated()}</div></div>
              <div><div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rating</div>
                <span className={`rating rating-${rating(Number(estimated()))}`} style={{ width: 32, height: 32, fontSize: 16, marginTop: 4 }}>{rating(Number(estimated()))}</span></div>
            </div>
          )}

          <button className="btn btn-primary" onClick={() => {
            if (!form.name) return
            addService(project.id, { ...form, calls_day: Number(form.calls_day), prompt_tokens: Number(form.prompt_tokens), completion_tokens: Number(form.completion_tokens), cost_month: Number(estimated() || 0) })
            setShowForm(false)
            setForm({ name: '', model: 'claude-haiku-4-5', calls_day: '', prompt_tokens: '', completion_tokens: '', caching_enabled: false })
          }}>Add Service</button>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Model</th>
            <th>Calls/Day</th>
            <th>Tokens (in/out)</th>
            <th>Caching</th>
            <th>Monthly Cost</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {(project.services || []).map(svc => {
            const r = svc.cost_month < 20 ? 'A' : svc.cost_month < 50 ? 'B' : svc.cost_month < 100 ? 'C' : 'D'
            return (
              <tr key={svc.id}>
                <td style={{ fontWeight: 600 }}>{svc.name}</td>
                <td style={{ fontSize: 12, color: 'var(--muted)' }}>{svc.model.replace('claude-', 'Claude ').replace('-', ' ')}</td>
                <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{svc.calls_day.toLocaleString()}</td>
                <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11.5, color: 'var(--muted)' }}>{svc.prompt_tokens.toLocaleString()} / {svc.completion_tokens.toLocaleString()}</td>
                <td>{svc.caching_enabled ? <span style={{ color: 'var(--green)', fontSize: 12, fontWeight: 600 }}>✓ On</span> : <span style={{ color: 'var(--amber)', fontSize: 12 }}>Off</span>}</td>
                <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--gold)', fontWeight: 600 }}>{formatCost(svc.cost_month)}</td>
                <td><span className={`rating rating-${r}`}>{r}</span></td>
              </tr>
            )
          })}
          {(project.services || []).length === 0 && (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>No services yet. Add your first AI service.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function GuardrailsTab({ project }) {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>Active guardrails prevent spend surprises before they reach your monthly bill.</div>
      </div>
      {(project.guardrails || []).map(g => {
        const def = GUARDRAIL_TYPES.find(t => t.id === g.type)
        const statusLabel = g.status === 'active' ? 'Passing' : g.status === 'warning' ? 'Warning' : 'Breached'
        return (
          <div key={g.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border2)', borderRadius: 10, padding: '16px 20px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className={`guardrail-status guardrail-${g.status}`} style={{ width: 10, height: 10 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{def?.label || g.type}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{def?.description}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {g.threshold && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Threshold</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: 'var(--gold)' }}>{g.threshold}{def?.unit ? ' ' + def.unit : ''}</div>
                  </div>
                )}
                {g.current !== null && g.current !== undefined && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: g.status === 'active' ? 'var(--green)' : g.status === 'warning' ? 'var(--amber)' : 'var(--red)' }}>
                      {g.current}{def?.unit ? ' ' + def.unit : ''}
                    </div>
                  </div>
                )}
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: g.status === 'active' ? 'var(--green-bg)' : g.status === 'warning' ? 'var(--amber-bg)' : 'var(--red-bg)', color: g.status === 'active' ? '#34D399' : g.status === 'warning' ? '#FCD34D' : '#F87171' }}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
        )
      })}
      {(project.guardrails || []).length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🛡️</div>
          <div className="empty-state-title">No guardrails configured</div>
          <div className="empty-state-sub">Add guardrails to receive alerts before spend surprises reach your monthly bill.</div>
        </div>
      )}
    </div>
  )
}

function DecisionsTab({ project, addDecision }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', rationale: '', model_chosen: '', alternatives_considered: '', quality_impact: 'neutral', cost_impact: '', risk_impact: 'low', owner: 'Nicole Martinez', status: 'pending' })

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>Architecture decisions with traceability, impact, and approval status.</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <i className={`ti ${showForm ? 'ti-x' : 'ti-plus'}`} /> {showForm ? 'Cancel' : 'Log Decision'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(212,185,106,0.3)' }}>
          <div className="card-title">New Architecture Decision</div>
          <div className="form-group">
            <label className="form-label">Decision Title</label>
            <input className="form-input" placeholder="e.g. Use Haiku for email drafts" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Rationale</label>
            <textarea className="form-textarea" placeholder="Why was this decision made?" value={form.rationale} onChange={e => setForm(p => ({ ...p, rationale: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Quality Impact</label>
              <select className="form-select" value={form.quality_impact} onChange={e => setForm(p => ({ ...p, quality_impact: e.target.value }))}>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cost Impact</label>
              <input className="form-input" placeholder="-78%" value={form.cost_impact} onChange={e => setForm(p => ({ ...p, cost_impact: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Risk Impact</label>
              <select className="form-select" value={form.risk_impact} onChange={e => setForm(p => ({ ...p, risk_impact: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Owner</label>
              <input className="form-input" value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => {
            if (!form.title) return
            addDecision(project.id, { ...form, alternatives_considered: form.alternatives_considered.split(',').map(s => s.trim()).filter(Boolean) })
            setShowForm(false)
            setForm({ title: '', rationale: '', model_chosen: '', alternatives_considered: '', quality_impact: 'neutral', cost_impact: '', risk_impact: 'low', owner: 'Nicole Martinez', status: 'pending' })
          }}>Log Decision</button>
        </div>
      )}

      {(project.decisions || []).length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No decisions logged</div>
          <div className="empty-state-sub">Log architecture decisions to create a traceable record of why AI choices were made.</div>
        </div>
      ) : (
        (project.decisions || []).map(d => (
          <div key={d.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border2)', borderRadius: 10, padding: '18px 20px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{d.title}</div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: d.status === 'approved' ? 'var(--green-bg)' : d.status === 'rejected' ? 'var(--red-bg)' : 'var(--amber-bg)', color: d.status === 'approved' ? '#34D399' : d.status === 'rejected' ? '#F87171' : '#FCD34D' }}>
                {d.status}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>{d.rationale}</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {d.cost_impact && <div><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cost Impact</div><div style={{ fontSize: 13, fontWeight: 600, color: d.cost_impact.startsWith('-') ? 'var(--green)' : 'var(--amber)' }}>{d.cost_impact}</div></div>}
              <div><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quality</div><div style={{ fontSize: 13, fontWeight: 600 }}>{d.quality_impact}</div></div>
              <div><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Risk</div><div style={{ fontSize: 13, fontWeight: 600 }}>{d.risk_impact}</div></div>
              <div><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Owner</div><div style={{ fontSize: 13, fontWeight: 600 }}>{d.owner}</div></div>
              {d.approval_date && <div><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Approved</div><div style={{ fontSize: 13, fontWeight: 600 }}>{d.approval_date}</div></div>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

const TABS = [
  { id: 'overview',   label: 'Overview',   icon: 'ti-layout-dashboard' },
  { id: 'services',   label: 'Services',   icon: 'ti-database' },
  { id: 'guardrails', label: 'Guardrails', icon: 'ti-shield-check' },
  { id: 'decisions',  label: 'Decisions',  icon: 'ti-clipboard-check' },
]

export default function ProjectDetail({ project, setPage, addService, addDecision }) {
  const [tab, setTab] = useState('overview')
  if (!project) return <div className="page"><div style={{ color: 'var(--muted)' }}>Project not found.</div></div>

  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', align: 'center', gap: 10, marginBottom: 6 }}>
            <button onClick={() => setPage('projects')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12.5, padding: 0 }}>
              ← Projects
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div className="page-title" style={{ marginBottom: 0 }}>{project.name}</div>
            <span className={`project-type-badge ${project.type === 'existing' ? 'badge-existing' : 'badge-new'}`}>{project.type}</span>
            <span className={`rating rating-${project.cost_score}`}>{project.cost_score}</span>
            <span className={`risk risk-${project.risk_level}`}><span className="dot" />{project.risk_level} risk</span>
          </div>
          <div className="page-sub">{project.description}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage('reports')}><i className="ti ti-presentation" /> Export PPT</button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <i className={`ti ${t.icon}`} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview'   && <OverviewTab project={project} />}
      {tab === 'services'   && <ServicesTab project={project} addService={addService} />}
      {tab === 'guardrails' && <GuardrailsTab project={project} />}
      {tab === 'decisions'  && <DecisionsTab project={project} addDecision={addDecision} />}
    </div>
  )
}
