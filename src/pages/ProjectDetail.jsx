import React, { useState, useEffect } from 'react'
import { generateProjectPPT } from '../utils/generatePPT.js'
import { GUARDRAIL_TYPES, MODELS, monthlySpend, formatCost } from '../data/demo.js'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ project }) {
  const spend = monthlySpend(project)
  const budget = Number(project.budget_annual || 0) / 12
  const forecast = spend * 12
  const variance = project.budget_annual > 0 ? ((forecast - Number(project.budget_annual)) / Number(project.budget_annual) * 100) : 0

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
        <div className="card">
          <div className="card-title">Spend Trend · Last 5 Weeks</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80, marginBottom: 8 }}>
            {(project.snapshots || []).slice().reverse().map((s, i, arr) => {
              const max = Math.max(...arr.map(x => Number(x.spend)))
              const h = max > 0 ? (Number(s.spend) / max) * 70 : 0
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>{formatCost(s.spend)}</div>
                  <div style={{ width: '100%', height: h, background: 'var(--gold)', borderRadius: '3px 3px 0 0', opacity: i === arr.length - 1 ? 1 : 0.5 }} />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {(project.snapshots || []).slice().reverse().map((s, i) => (
              <span key={i} style={{ flex: 1, fontSize: 9.5, color: 'var(--muted)', textAlign: 'center' }}>{s.period_label || s.week}</span>
            ))}
          </div>
        </div>

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
                  {g.threshold && <span className="guardrail-threshold">{g.current_value !== null ? `${g.current_value} / ` : ''}{g.threshold}{def?.unit ? ' ' + def.unit : ''}</span>}
                </div>
              )
            })
          )}
        </div>
      </div>

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

// ── Services Tab ──────────────────────────────────────────────────────────────
function ServicesTab({ project, reload }) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', model_id: 'claude-haiku-4-5', calls_per_day: '', prompt_tokens_avg: '', completion_tokens_avg: '', caching_enabled: false })
  const [estimate, setEstimate] = useState(null)

  async function calcEstimate(f) {
    if (!f.calls_per_day || !f.prompt_tokens_avg || !f.completion_tokens_avg) return
    try {
      const r = await fetch(`${API}/api/pricing/estimate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_id: f.model_id, calls_per_day: Number(f.calls_per_day), prompt_tokens: Number(f.prompt_tokens_avg), completion_tokens: Number(f.completion_tokens_avg) }),
      })
      const data = await r.json()
      if (data.success) setEstimate(data.data)
    } catch {}
  }

  function updateForm(updates) {
    const next = { ...form, ...updates }
    setForm(next)
    calcEstimate(next)
  }

  async function handleAdd() {
    if (!form.name) return
    setSaving(true)
    try {
      await fetch(`${API}/api/services`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, project_id: project.id, calls_per_day: Number(form.calls_per_day), prompt_tokens_avg: Number(form.prompt_tokens_avg), completion_tokens_avg: Number(form.completion_tokens_avg) }),
      })
      setShowForm(false)
      setForm({ name: '', model_id: 'claude-haiku-4-5', calls_per_day: '', prompt_tokens_avg: '', completion_tokens_avg: '', caching_enabled: false })
      setEstimate(null)
      reload()
    } catch (err) { alert('Error adding service: ' + err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this service?')) return
    await fetch(`${API}/api/services/${id}`, { method: 'DELETE' })
    reload()
  }

  const rating = (cost) => cost < 20 ? 'A' : cost < 50 ? 'B' : cost < 100 ? 'C' : 'D'

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
              <input className="form-input" placeholder="e.g. Email Draft Generation" value={form.name} onChange={e => updateForm({ name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <select className="form-select" value={form.model_id} onChange={e => updateForm({ model_id: e.target.value })}>
                {MODELS.map(m => <option key={m.id} value={m.id}>{m.name} — ${m.costPer1MIn}/M in</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Calls Per Day</label>
              <input className="form-input" type="number" placeholder="50" value={form.calls_per_day} onChange={e => updateForm({ calls_per_day: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Prompt Tokens (avg)</label>
              <input className="form-input" type="number" placeholder="800" value={form.prompt_tokens_avg} onChange={e => updateForm({ prompt_tokens_avg: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Completion Tokens (avg)</label>
              <input className="form-input" type="number" placeholder="400" value={form.completion_tokens_avg} onChange={e => updateForm({ completion_tokens_avg: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Caching Enabled</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <input type="checkbox" checked={form.caching_enabled} onChange={e => updateForm({ caching_enabled: e.target.checked })} />
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Enable prompt caching</span>
              </div>
            </div>
          </div>
          {estimate && (
            <div style={{ background: 'rgba(212,185,106,0.07)', border: '1px solid rgba(212,185,106,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 20 }}>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Est. Monthly Cost</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 22, color: 'var(--gold)', fontWeight: 700 }}>${estimate.cost_exp_month}</div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rating</div>
                <span className={`rating rating-${rating(estimate.cost_exp_month)}`} style={{ width: 32, height: 32, fontSize: 16, marginTop: 4 }}>{rating(estimate.cost_exp_month)}</span>
              </div>
            </div>
          )}
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Service'}</button>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr><th>Service</th><th>Model</th><th>Calls/Day</th><th>Tokens (in/out)</th><th>Caching</th><th>Monthly Cost</th><th>Rating</th><th></th></tr>
        </thead>
        <tbody>
          {(project.services || []).map(svc => {
            const r = rating(Number(svc.cost_month))
            return (
              <tr key={svc.id}>
                <td style={{ fontWeight: 600 }}>{svc.name}</td>
                <td style={{ fontSize: 12, color: 'var(--muted)' }}>{svc.model_id?.replace('claude-', 'Claude ')?.replace(/-/g, ' ')}</td>
                <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{Number(svc.calls_per_day).toLocaleString()}</td>
                <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11.5, color: 'var(--muted)' }}>{Number(svc.prompt_tokens_avg).toLocaleString()} / {Number(svc.completion_tokens_avg).toLocaleString()}</td>
                <td>{svc.caching_enabled ? <span style={{ color: 'var(--green)', fontSize: 12, fontWeight: 600 }}>✓ On</span> : <span style={{ color: 'var(--amber)', fontSize: 12 }}>Off</span>}</td>
                <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--gold)', fontWeight: 600 }}>{formatCost(svc.cost_month)}</td>
                <td><span className={`rating rating-${r}`}>{r}</span></td>
                <td><button onClick={() => handleDelete(svc.id)} className="btn btn-danger btn-sm"><i className="ti ti-trash" /></button></td>
              </tr>
            )
          })}
          {(project.services || []).length === 0 && (
            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>No services yet. Add your first AI service.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Guardrails Tab ────────────────────────────────────────────────────────────
function GuardrailsTab({ project, reload }) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ type: 'monthly_ceiling', threshold: '', operator: 'lte', action: 'alert' })

  const selectedType = GUARDRAIL_TYPES.find(t => t.id === form.type)

  async function handleAdd() {
    setSaving(true)
    try {
      await fetch(`${API}/api/guardrails`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id, type: form.type, label: selectedType?.label || form.type, threshold: form.threshold ? Number(form.threshold) : null, operator: form.operator, action: form.action }),
      })
      setShowForm(false)
      setForm({ type: 'monthly_ceiling', threshold: '', operator: 'lte', action: 'alert' })
      reload()
    } catch (err) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this guardrail?')) return
    await fetch(`${API}/api/guardrails/${id}`, { method: 'DELETE' })
    reload()
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>Guardrails prevent spend surprises before they reach your monthly bill.</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <i className={`ti ${showForm ? 'ti-x' : 'ti-plus'}`} /> {showForm ? 'Cancel' : 'Add Guardrail'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(212,185,106,0.3)' }}>
          <div className="card-title">New Guardrail</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Guardrail Type</label>
              <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {GUARDRAIL_TYPES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
              {selectedType && <div className="form-hint">{selectedType.description}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Action</label>
              <select className="form-select" value={form.action} onChange={e => setForm(p => ({ ...p, action: e.target.value }))}>
                <option value="alert">Alert — notify but allow</option>
                <option value="warn">Warn — surface in UI</option>
                <option value="block">Block — prevent execution</option>
              </select>
            </div>
            {selectedType?.unit && (
              <div className="form-group">
                <label className="form-label">Threshold ({selectedType.unit})</label>
                <input className="form-input" type="number" placeholder="e.g. 150" value={form.threshold} onChange={e => setForm(p => ({ ...p, threshold: e.target.value }))} />
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Guardrail'}</button>
        </div>
      )}

      {(project.guardrails || []).length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛡️</div>
          <div className="empty-state-title">No guardrails configured</div>
          <div className="empty-state-sub">Add guardrails to receive alerts before spend surprises reach your monthly bill.</div>
        </div>
      ) : (
        (project.guardrails || []).map(g => {
          const def = GUARDRAIL_TYPES.find(t => t.id === g.type)
          const statusLabel = g.status === 'active' ? 'Passing' : g.status === 'warning' ? 'Warning' : 'Breached'
          return (
            <div key={g.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border2)', borderRadius: 10, padding: '16px 20px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className={`guardrail-status guardrail-${g.status}`} style={{ width: 10, height: 10 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{def?.label || g.type}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{def?.description}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {g.threshold && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Threshold</div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: 'var(--gold)' }}>{g.threshold}{def?.unit ? ' ' + def.unit : ''}</div>
                    </div>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: g.status === 'active' ? 'var(--green-bg)' : g.status === 'warning' ? 'var(--amber-bg)' : 'var(--red-bg)', color: g.status === 'active' ? '#34D399' : g.status === 'warning' ? '#FCD34D' : '#F87171' }}>
                    {statusLabel}
                  </span>
                  <button onClick={() => handleDelete(g.id)} className="btn btn-danger btn-sm"><i className="ti ti-trash" /></button>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ── Architecture Review Tab ───────────────────────────────────────────────────
const ARCH_QUESTIONS = [
  { id: 'purpose',    label: 'What is the primary purpose of this AI application?',              placeholder: 'e.g. Generate personalized client communications based on CRM data' },
  { id: 'users',      label: 'Who are the users and how many concurrent users do you expect?',    placeholder: 'e.g. 50 financial advisors, peak 20 concurrent' },
  { id: 'frequency',  label: 'How frequently will AI be invoked? (calls per user per day)',       placeholder: 'e.g. 5–10 times per advisor per day' },
  { id: 'context',    label: 'What context will be provided to the AI? (data sources, docs)',     placeholder: 'e.g. CRM client record, calendar events, email history' },
  { id: 'output',     label: 'What does the AI output? (document, decision, classification)',     placeholder: 'e.g. 200–400 word personalized email draft' },
  { id: 'quality',    label: 'How sensitive is quality? (high / medium / low)',                   placeholder: 'e.g. High — advisors review before sending to clients' },
  { id: 'latency',    label: 'What is the acceptable latency? (real-time / seconds / batch)',     placeholder: 'e.g. 3–5 seconds acceptable, not real-time' },
  { id: 'compliance', label: 'Are there compliance or data privacy requirements?',                placeholder: 'e.g. FINRA regulated, no PII to external models without consent' },
]

function ArchReviewTab({ project, reload }) {
  const [existing, setExisting] = useState(null)
  const [mode, setMode] = useState('create')
  const [answers, setAnswers] = useState({})
  const [estimate, setEstimate] = useState(null)
  const [claudeSummary, setClaudeSummary] = useState(null)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [step, setStep] = useState(1)
  const [loadingReview, setLoadingReview] = useState(false)

  // Reset and load review when project changes
  useEffect(() => {
    setExisting(null)
    setClaudeSummary(null)
    setMode('create')
    setStep(1)

    // Restore draft answers from sessionStorage while we wait for API
    const draftKey = `finops_draft_answers_${project.id}`
    const savedDraft = sessionStorage.getItem(draftKey)
    if (savedDraft) {
      try { setAnswers(JSON.parse(savedDraft)) } catch {}
    } else {
      setAnswers({})
    }

    async function loadReview() {
      setLoadingReview(true)
      try {
        const r = await fetch(`${API}/api/reviews/${project.id}`)
        const data = await r.json()
        if (data.success && data.data) {
          // Parse interview_answers if it came back as a string
          let ia = data.data.interview_answers || {}
          if (typeof ia === 'string') { try { ia = JSON.parse(ia) } catch {} }
          setExisting(data.data)
          setAnswers(ia)
          setClaudeSummary(data.data.claude_summary || null)
          setMode('view')
          // Clear draft since we have saved data
          sessionStorage.removeItem(draftKey)
        }
      } catch (err) {
        console.warn('Could not load review:', err.message)
      } finally {
        setLoadingReview(false)
      }
    }
    loadReview()
  }, [project.id])

  // Autosave answers to sessionStorage as user types
  useEffect(() => {
    if (mode === 'create' && Object.keys(answers).length > 0) {
      const draftKey = `finops_draft_answers_${project.id}`
      sessionStorage.setItem(draftKey, JSON.stringify(answers))
    }
  }, [answers, project.id, mode])

  function calcEstimate(ans) {
    const freq = parseInt(ans.frequency) || 10
    const users = parseInt(ans.users) || 20
    const quality = (ans.quality || '').toLowerCase()
    let model = 'claude-haiku-4-5'
    let promptTokens = 800
    let completionTokens = 400
    const callsDay = freq * users
    if (quality.includes('high')) { model = 'claude-sonnet-4-6'; promptTokens = 2000; completionTokens = 800 }
    if (ans.context && ans.context.length > 100) promptTokens = Math.round(promptTokens * 1.5)
    if (ans.output && ans.output.toLowerCase().includes('document')) completionTokens = Math.round(completionTokens * 1.5)
    const m = MODELS.find(x => x.id === model)
    const monthlyIn  = (callsDay * 30 * promptTokens)     / 1_000_000 * m.costPer1MIn
    const monthlyOut = (callsDay * 30 * completionTokens) / 1_000_000 * m.costPer1MOut
    const expected = monthlyIn + monthlyOut
    return {
      model, callsDay, promptTokens, completionTokens,
      low: expected * 0.6, expected, high: expected * 1.8,
      annualExpected: expected * 12,
      retrievalStrategy: promptTokens > 1500 ? 'Use RAG to reduce context size before LLM call' : 'Direct prompting acceptable at this context size',
      cachingRecommended: callsDay > 20,
    }
  }

  function handleAnswerNext() {
    const est = calcEstimate(answers)
    setEstimate(est)
    setStep(2)
  }

  async function handleGenerateAndSave() {
    setGenerating(true)
    try {
      // Ask Claude for summary
      const prompt = `You are an AI FinOps Architecture expert. Based on the following project information and cost estimates, provide a concise executive architecture review summary (3-4 paragraphs). Focus on: recommended architecture approach, key cost drivers, risk areas, and top 3 optimization recommendations. Be specific and actionable.

Project: ${project.name}
Type: ${project.type}

Architecture Interview Answers:
${Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join('\n')}

Cost Estimate:
- Recommended Model: ${estimate?.model}
- Calls per Day: ${estimate?.callsDay}
- Monthly Cost (Low/Expected/High): $${estimate?.low?.toFixed(0)} / $${estimate?.expected?.toFixed(0)} / $${estimate?.high?.toFixed(0)}
- Annual Expected: $${estimate?.annualExpected?.toFixed(0)}
- Retrieval Strategy: ${estimate?.retrievalStrategy}
- Caching Recommended: ${estimate?.cachingRecommended ? 'Yes' : 'No'}

Provide a professional, executive-ready architecture review summary.`

      const r = await fetch(`${API}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt, page: 'arch-review', projectId: project.id }),
      })
      const data = await r.json()
      const summary = data.success ? data.answer : 'Architecture review generated from inputs above.'
      setClaudeSummary(summary)

      // Save to Neon
      setSaving(true)
      await fetch(`${API}/api/reviews/${project.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_answers: answers,
          recommended_arch: estimate?.retrievalStrategy,
          retrieval_strategy: estimate?.retrievalStrategy,
          model_choices: [{ model: estimate?.model, rationale: 'Recommended based on quality and usage requirements' }],
          assumptions: [`${estimate?.callsDay} calls/day`, `${estimate?.promptTokens} prompt tokens avg`],
          approval_status: 'draft',
          claude_summary: summary,
        }),
      })

      // Auto-create a service from the estimate if no services exist yet
      if ((project.services || []).length === 0 && estimate) {
        try {
          await fetch(`${API}/api/services`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_id: project.id,
              name: project.name + ' — AI Service',
              model_id: estimate.model,
              calls_per_day: estimate.callsDay,
              prompt_tokens_avg: estimate.promptTokens,
              completion_tokens_avg: estimate.completionTokens,
              caching_enabled: estimate.cachingRecommended,
            }),
          })
        } catch (e) { console.warn('Could not auto-create service:', e.message) }
      }

      // Clear draft
      sessionStorage.removeItem(`finops_draft_answers_${project.id}`)
      setMode('view')
      reload()
    } catch (err) {
      alert('Error generating review: ' + err.message)
    } finally {
      setGenerating(false)
      setSaving(false)
    }
  }

  if (loadingReview) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
        <i className="ti ti-loader" style={{ fontSize: 24, animation: 'spin 1s linear infinite', display: 'block', marginBottom: 12 }} />
        Loading architecture review...
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    )
  }

  if (mode === 'view' && (existing || claudeSummary)) {
    const review = existing || {}
    const ia = review.interview_answers || answers
    return (
      <div className="fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Architecture Review</div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'var(--green-bg)', color: '#34D399' }}>
              {review.approval_status || 'Draft'}
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setStep(1); setMode('create') }}>
            <i className="ti ti-edit" /> Update Review
          </button>
        </div>

        {(claudeSummary || review.claude_summary) && (
          <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(212,185,106,0.3)' }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-sparkles" style={{ color: 'var(--gold)' }} /> AI Architecture Summary
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {claudeSummary || review.claude_summary}
            </div>
          </div>
        )}

        {Object.keys(ia).length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">Interview Answers</div>
            {ARCH_QUESTIONS.filter(q => ia[q.id]).map(q => (
              <div key={q.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border2)' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{q.label}</div>
                <div style={{ fontSize: 13.5, color: 'var(--text)' }}>{ia[q.id]}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[1, 2].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= s ? 'var(--gold)' : 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>

      {step === 1 && (
        <div style={{ maxWidth: 640 }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Architecture Interview</div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 24 }}>Answer these questions to generate a cost estimate and AI architecture review.</div>
          {ARCH_QUESTIONS.map(q => (
            <div className="form-group" key={q.id}>
              <label className="form-label">{q.label}</label>
              <input className="form-input" placeholder={q.placeholder} value={answers[q.id] || ''} onChange={e => { const next = { ...answers, [q.id]: e.target.value }; setAnswers(next) }} />
            </div>
          ))}
          <button className="btn btn-primary" onClick={handleAnswerNext}>Generate Estimate & Review →</button>
        </div>
      )}

      {step === 2 && estimate && (
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Architecture Review</div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 24 }}>Review the estimate and generate your AI architecture summary.</div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">Cost Estimate Range · Monthly</div>
            <div className="estimate-range">
              <div className="estimate-col low">
                <div className="estimate-col-label">Low</div>
                <div className="estimate-col-value">${estimate.low.toFixed(0)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Optimistic — caching, efficient prompts</div>
              </div>
              <div className="estimate-col expected">
                <div className="estimate-col-label">Expected</div>
                <div className="estimate-col-value">${estimate.expected.toFixed(0)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Based on your inputs</div>
              </div>
              <div className="estimate-col high">
                <div className="estimate-col-label">High</div>
                <div className="estimate-col-value">${estimate.high.toFixed(0)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Growth, no caching</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase' }}>Annual (expected)</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, color: 'var(--gold)', fontWeight: 700 }}>${Math.round(estimate.annualExpected).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase' }}>Recommended Model</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', marginTop: 4 }}>{estimate.model.replace('claude-', 'Claude ').replace(/-/g, ' ')}</div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase' }}>Calls/Day</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 700 }}>{estimate.callsDay}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">Architecture Guidance</div>
            <div className="rec-card">
              <i className="ti ti-database rec-icon" style={{ color: 'var(--steel)' }} />
              <div><div className="rec-title">Retrieval Strategy</div><div className="rec-body">{estimate.retrievalStrategy}</div></div>
            </div>
            {estimate.cachingRecommended && (
              <div className="rec-card">
                <i className="ti ti-database rec-icon" style={{ color: 'var(--green)' }} />
                <div>
                  <div className="rec-title">Enable Prompt Caching</div>
                  <div className="rec-body">At {estimate.callsDay} calls/day, caching static context can reduce costs by 30–50%.</div>
                  <span className="rec-priority rec-high">High impact</span>
                </div>
              </div>
            )}
            <div className="rec-card">
              <i className="ti ti-brain rec-icon" style={{ color: 'var(--gold)' }} />
              <div>
                <div className="rec-title">Deterministic vs. AI Reasoning</div>
                <div className="rec-body">Use deterministic logic for scoring, filtering, and routing. Reserve AI for language generation and synthesis where rules would be too complex.</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" onClick={handleGenerateAndSave} disabled={generating || saving}>
              <i className={`ti ${generating ? 'ti-loader' : 'ti-sparkles'}`} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }} />
              {generating ? 'Claude is reviewing...' : saving ? 'Saving...' : 'Generate AI Summary & Save'}
            </button>
          </div>
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      )}
    </div>
  )
}

// ── Decisions Tab ─────────────────────────────────────────────────────────────
function DecisionsTab({ project, reload }) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', rationale: '', model_chosen: '', alternatives_considered: '', quality_impact: 'neutral', cost_impact: '', risk_impact: 'low', owner: 'Nicole Martinez', status: 'pending' })

  async function handleAdd() {
    if (!form.title) return
    setSaving(true)
    try {
      await fetch(`${API}/api/decisions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, project_id: project.id, alternatives_considered: form.alternatives_considered.split(',').map(s => s.trim()).filter(Boolean) }),
      })
      setShowForm(false)
      setForm({ title: '', rationale: '', model_chosen: '', alternatives_considered: '', quality_impact: 'neutral', cost_impact: '', risk_impact: 'low', owner: 'Nicole Martinez', status: 'pending' })
      reload()
    } catch (err) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this decision?')) return
    await fetch(`${API}/api/decisions/${id}`, { method: 'DELETE' })
    reload()
  }

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
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Saving...' : 'Log Decision'}</button>
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: d.status === 'approved' ? 'var(--green-bg)' : d.status === 'rejected' ? 'var(--red-bg)' : 'var(--amber-bg)', color: d.status === 'approved' ? '#34D399' : d.status === 'rejected' ? '#F87171' : '#FCD34D' }}>
                  {d.status}
                </span>
                <button onClick={() => handleDelete(d.id)} className="btn btn-danger btn-sm"><i className="ti ti-trash" /></button>
              </div>
            </div>
            {d.rationale && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>{d.rationale}</div>}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {d.cost_impact && <div><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cost Impact</div><div style={{ fontSize: 13, fontWeight: 600, color: String(d.cost_impact).startsWith('-') ? 'var(--green)' : 'var(--amber)' }}>{d.cost_impact}</div></div>}
              <div><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quality</div><div style={{ fontSize: 13, fontWeight: 600 }}>{d.quality_impact}</div></div>
              <div><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Risk</div><div style={{ fontSize: 13, fontWeight: 600 }}>{d.risk_impact}</div></div>
              {d.owner && <div><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Owner</div><div style={{ fontSize: 13, fontWeight: 600 }}>{d.owner}</div></div>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ── Main ProjectDetail ────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',      label: 'Overview',             icon: 'ti-layout-dashboard' },
  { id: 'services',      label: 'Services',             icon: 'ti-database' },
  { id: 'arch-review',   label: 'Architecture Review',  icon: 'ti-topology-star' },
  { id: 'guardrails',    label: 'Guardrails',           icon: 'ti-shield-check' },
  { id: 'decisions',     label: 'Decisions',            icon: 'ti-clipboard-check' },
]

export default function ProjectDetail({ project, setPage, addService, addDecision, reload }) {
  const [tab, setTab] = useState(() => {
    const hint = sessionStorage.getItem('finops_open_tab')
    if (hint) { sessionStorage.removeItem('finops_open_tab'); return hint }
    return 'overview'
  })
  if (!project) return <div className="page"><div style={{ color: 'var(--muted)' }}>Project not found.</div></div>

  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <button onClick={() => setPage('projects')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12.5, padding: 0 }}>
              ← Projects
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span className={`project-type-badge ${project.type === 'existing' ? 'badge-existing' : 'badge-new'}`}>{project.type}</span>
            <span className={`rating rating-${project.cost_score}`}>{project.cost_score}</span>
            <span className={`risk risk-${project.risk_level}`}><span className="dot" />{project.risk_level} risk</span>
          </div>
          <div className="page-sub">{project.description}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={reload}><i className="ti ti-refresh" /> Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={() => generateProjectPPT(project)}><i className="ti ti-presentation" /> Export PPT</button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <i className={`ti ${t.icon}`} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview'    && <OverviewTab project={project} />}
      {tab === 'services'    && <ServicesTab project={project} reload={reload} />}
      {tab === 'arch-review' && <ArchReviewTab project={project} reload={reload} />}
      {tab === 'guardrails'  && <GuardrailsTab project={project} reload={reload} />}
      {tab === 'decisions'   && <DecisionsTab project={project} reload={reload} />}
    </div>
  )
}
