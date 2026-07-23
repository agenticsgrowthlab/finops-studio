import React, { useState } from 'react'
import { monthlySpend, formatCost, MODELS } from '../data/demo.js'
import { generateProjectPPT } from '../utils/generatePPT.js'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Helper — effective monthly spend: services OR estimate if no services yet
function effectiveSpend(project) {
  const svcSpend = monthlySpend(project)
  if (svcSpend > 0) return svcSpend
  const est = project.estimate
  if (est && Number(est.cost_exp_month) > 0) return Number(est.cost_exp_month)
  return 0
}

export function ArchReviews({ projects, reload }) {
  const [approving, setApproving] = useState(null)
  const [selectedId, setSelectedId] = useState('all')
  const [collapsed, setCollapsed] = useState({})
  const [expandedSummary, setExpandedSummary] = useState({})

  const withReviews = [...projects.filter(p => p.arch_review)].sort((a,b) => a.name.localeCompare(b.name))
  const withoutReviews = [...projects.filter(p => !p.arch_review)].sort((a,b) => a.name.localeCompare(b.name))
  const displayReviews = selectedId === 'all' ? withReviews : withReviews.filter(p => p.id === selectedId)

  function toggleCollapse(id) { setCollapsed(c => ({ ...c, [id]: !c[id] })) }

  async function handleApprove(project) {
    setApproving(project.id)
    try {
      await fetch(`${API}/api/reviews/${project.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...project.arch_review,
          interview_answers: project.arch_review.interview_answers || {},
          approval_status: 'approved',
        }),
      })
      if (reload) reload()
    } catch (err) {
      alert('Error approving review: ' + err.message)
    } finally {
      setApproving(null)
    }
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-sub">Formal AI architecture assessments — deterministic cost estimates, model selection, Claude analysis, and approval status</div>
      </div>

      {withReviews.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No architecture reviews yet</div>
          <div className="empty-state-sub">Open any project → Architecture Review tab to generate a review.</div>
        </div>
      )}

      {withReviews.length > 0 && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filter:</label>
          <select className="form-select" value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{ width: 300 }}>
            <option value="all">All Projects with Reviews ({withReviews.length})</option>
            {withReviews.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {displayReviews.map(p => {
        const review = p.arch_review
        const spend = effectiveSpend(p)
        const isApproved = review.approval_status === 'approved'
        const isCollapsed = collapsed[p.id]
        return (
          <div key={p.id} className="card" style={{ marginBottom: 12 }}>
            {/* Header — always visible, click to collapse */}
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', marginBottom: isCollapsed ? 0 : 16 }}
              onClick={() => toggleCollapse(p.id)}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</div>
                  <span className={`project-type-badge ${p.type === 'existing' ? 'badge-existing' : 'badge-new'}`}>{p.type}</span>
                  <span className={`rating rating-${p.cost_score}`}>{p.cost_score}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{p.description?.slice(0, 100)}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: isApproved ? 'var(--green-bg)' : 'var(--amber-bg)', color: isApproved ? '#34D399' : '#FCD34D' }}>
                  {isApproved ? '✓ Approved' : review.approval_status || 'Draft'}
                </span>
                {!isApproved && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleApprove(p)} disabled={approving === p.id}>
                    <i className={`ti ${approving === p.id ? 'ti-loader' : 'ti-check'}`} />
                    {approving === p.id ? 'Approving...' : 'Approve'}
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => generateProjectPPT(p)}>
                  <i className="ti ti-presentation" /> PPT
                </button>
                <i className={`ti ${isCollapsed ? 'ti-chevron-down' : 'ti-chevron-up'}`} style={{ fontSize: 14, color: 'var(--muted)', marginLeft: 4, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); toggleCollapse(p.id) }} />
              </div>
            </div>

            {/* Collapsible body */}
            {!isCollapsed && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Arch Score</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: p.arch_score >= 80 ? 'var(--green)' : 'var(--amber)' }}>{p.arch_score}/100</div>
                  </div>
                  <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Monthly Spend</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{formatCost(spend)}</div>
                  </div>
                  <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Annual Forecast</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{formatCost(spend * 12)}</div>
                  </div>
                  <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Risk Level</div>
                    <span className={`risk risk-${p.risk_level}`}><span className="dot" />{p.risk_level}</span>
                  </div>
                </div>

                {review.claude_summary && (
                  <div
                    onClick={() => setExpandedSummary(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                    style={{ background: 'rgba(212,185,106,0.05)', border: '1px solid rgba(212,185,106,0.15)', borderRadius: 10, padding: '14px 18px', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i className="ti ti-sparkles" /> AI Architecture Summary</span>
                      <i className={`ti ${expandedSummary[p.id] ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 13 }} />
                    </div>
                    {expandedSummary[p.id] ? (
                      <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                        {review.claude_summary.replace(/#{1,3} /g, '').replace(/\*\*/g, '')}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7, maxHeight: 80, overflow: 'hidden', maskImage: 'linear-gradient(to bottom, black 50%, transparent)' }}>
                        {review.claude_summary.replace(/#{1,3} /g, '').replace(/\*\*/g, '').slice(0, 300)}...
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}

      {withoutReviews.length > 0 && (
        <div className="card" style={{ marginTop: 8 }}>
          <div className="card-title">Projects Without Architecture Reviews</div>
          {withoutReviews.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border2)' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>Open project → Architecture Review tab</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


export function ScenarioPlanning({ projects }) {
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '')
  const [multiplier, setMultiplier] = useState(2)
  const [model, setModel] = useState('')

  const project = projects.find(p => p.id === selectedProject)
  const baseSpend = project ? effectiveSpend(project) : 0
  const scenarioSpend = baseSpend * multiplier
  const modelScenario = MODELS.find(m => m.id === model)

  return (
    <div className="page fade-in">
      <div className="page-header">
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
                  {project && project.budget_annual ? (((scenarioSpend * 12 - Number(project.budget_annual)) / Number(project.budget_annual)) * 100).toFixed(0) : '—'}%
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


function exportSpendCSV(projects) {
  const rows = [
    ['Project', 'Type', 'Team', 'Service', 'Model', 'Calls/Day', 'Prompt Tokens', 'Completion Tokens', 'Caching', 'Monthly Cost', 'Annual Forecast', 'Cost Rating', 'Risk Level', 'Arch Score', 'Budget Annual', 'Budget Variance %'],
  ]

  projects.forEach(p => {
    const services = p.services || []
    if (services.length === 0) {
      const est = p.estimate
      const monthly = est ? Number(est.cost_exp_month) : 0
      rows.push([
        p.name, p.type, p.team || '', '(Estimate only)', est?.model || '', '', '', '', '', 
        monthly.toFixed(2), (monthly * 12).toFixed(2),
        p.cost_score || '', p.risk_level || '', p.arch_score || '',
        p.budget_annual || '', '',
      ])
    } else {
      services.forEach(svc => {
        const monthly = Number(svc.cost_month || 0)
        const annual = monthly * 12
        const budget = Number(p.budget_annual || 0)
        const variance = budget > 0 ? (((annual - budget) / budget) * 100).toFixed(1) : ''
        rows.push([
          p.name, p.type, p.team || '', svc.name, 
          svc.model_id || '', svc.calls_per_day || '',
          svc.prompt_tokens_avg || '', svc.completion_tokens_avg || '',
          svc.caching_enabled ? 'Yes' : 'No',
          monthly.toFixed(2), annual.toFixed(2),
          p.cost_score || '', p.risk_level || '', p.arch_score || '',
          budget || '', variance,
        ])
      })
    }
  })

  const esc = v => '"' + String(v).replace(/"/g, '""') + '"'
  const csv = rows.map(r => r.map(esc).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `AI_FinOps_Spend_Report_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function LeadershipReports({ projects }) {
  const totalMonthly = projects.reduce((s, p) => s + effectiveSpend(p), 0)
  const [generating, setGenerating] = useState(null)

  async function handleDownload(project) {
    setGenerating(project ? project.id : 'all')
    try {
      await generateProjectPPT(project || { name: 'AI FinOps Executive Summary', ...buildPortfolioSummary(projects) })
    } catch (err) {
      alert('Error generating PPT: ' + err.message)
    } finally {
      setGenerating(null)
    }
  }

  function buildPortfolioSummary(projects) {
    return {
      id: 'portfolio',
      type: 'existing',
      description: 'Portfolio-wide executive summary across all Agentics Growth Lab AI projects',
      budget_annual: projects.reduce((s, p) => s + Number(p.budget_annual || 0), 0),
      arch_score: Math.round(projects.reduce((s, p) => s + (p.arch_score || 0), 0) / (projects.length || 1)),
      cost_score: 'A',
      risk_level: 'low',
      services: projects.flatMap(p => p.services || []),
      guardrails: projects.flatMap(p => p.guardrails || []),
      snapshots: projects.flatMap(p => p.snapshots || []).slice(0, 6),
      recommendations: projects.flatMap(p => p.recommendations || []).slice(0, 4),
      decisions: projects.flatMap(p => p.decisions || []).slice(0, 4),
      arch_review: null,
      alerts: projects.flatMap(p => p.alerts || []),
    }
  }

  const reportItems = [
    { icon: 'ti-presentation', title: 'AI FinOps Executive Summary', desc: 'Total spend, efficiency ratings, open alerts, top recommendations across all projects.', tag: 'All Projects', project: null },
    ...projects.map(p => ({
      icon: 'ti-chart-bar',
      title: `${p.name} — Project Report`,
      desc: `Monthly run rate, guardrail status, architecture score, decisions log, and recommendations.`,
      tag: p.name,
      project: p,
    })),
  ]

  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-sub">Executive-ready PowerPoint reports generated from live project data</div>
        </div>
        <button className="btn btn-ghost" onClick={() => exportSpendCSV(projects)} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <i className="ti ti-file-spreadsheet" /> Export Spend CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {reportItems.map((r, i) => (
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
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleDownload(r.project)}
                disabled={generating !== null}
              >
                <i className={`ti ${generating === (r.project?.id || 'all') ? 'ti-loader' : 'ti-download'}`}
                  style={{ animation: generating === (r.project?.id || 'all') ? 'spin 1s linear infinite' : 'none' }} />
                {generating === (r.project?.id || 'all') ? 'Generating...' : 'Download PPT'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-title">Portfolio Preview · AI FinOps Executive Summary</div>
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
        <div style={{ fontSize: 12.5, color: 'var(--muted)', fontStyle: 'italic' }}>PPT includes: spend trends, per-project breakdown, guardrail status, architecture scores, open alerts, and top recommendations.</div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}

export function Settings() {
  return (
    <div className="page fade-in">
      <div className="page-header">
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
            <label className="form-label">Claude AI</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(14,122,92,0.1)', border: '1px solid rgba(14,122,92,0.3)', borderRadius: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)', display: 'inline-block' }} />
              <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>Connected</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>· Configured by Administrator</span>
            </div>
            <div className="form-hint">API key is server-side only and never exposed to the browser.</div>
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