import React from 'react'
import { monthlySpend, formatCost } from '../data/demo.js'

export default function Dashboard({ projects, setPage, setActiveProjectId }) {
  const totalMonthly = projects.reduce((s, p) => s + monthlySpend(p), 0)
  const totalAnnualBudget = projects.reduce((s, p) => s + (p.budget_annual || 0), 0)
  const totalAlerts = projects.reduce((s, p) => s + (p.alerts || []).length, 0)
  const totalServices = projects.reduce((s, p) => s + (p.services || []).length, 0)
  const annualForecast = totalMonthly * 12
  const budgetVariance = ((annualForecast - totalAnnualBudget) / totalAnnualBudget * 100)

  const ratingCount = { A: 0, B: 0, C: 0, D: 0 }
  projects.forEach(p => { if (p.cost_score) ratingCount[p.cost_score]++ })

  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">FinOps Dashboard</div>
          <div className="page-sub">AI spend overview across all Agentics Growth Lab projects</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm"><i className="ti ti-refresh" /> Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={() => setPage('reports')}><i className="ti ti-presentation" /> Leadership Report</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="stat-grid stat-grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Monthly Run Rate</div>
          <div className="stat-value">{formatCost(totalMonthly)}</div>
          <div className="stat-sub">{totalServices} active services</div>
          <div className="stat-change up" style={{ color: 'var(--amber)' }}>↑ 7.3% vs last week</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Annual Forecast</div>
          <div className="stat-value">{formatCost(annualForecast)}</div>
          <div className="stat-sub">Budget: {formatCost(totalAnnualBudget)}</div>
          <div className="stat-change" style={{ color: budgetVariance < 0 ? 'var(--green)' : 'var(--amber)' }}>
            {budgetVariance > 0 ? '↑' : '↓'} {Math.abs(budgetVariance).toFixed(1)}% vs budget
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Projects</div>
          <div className="stat-value" style={{ fontSize: 32 }}>{projects.length}</div>
          <div className="stat-sub">{projects.filter(p => p.type === 'existing').length} existing · {projects.filter(p => p.type === 'new').length} new</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open Alerts</div>
          <div className="stat-value" style={{ fontSize: 32, color: totalAlerts > 0 ? 'var(--red)' : 'var(--green)' }}>{totalAlerts}</div>
          <div className="stat-sub">{totalAlerts === 0 ? 'All guardrails passing' : 'Require attention'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Project health */}
        <div className="card">
          <div className="card-title">Project Health · Cost Efficiency Ratings</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {['A','B','C','D'].map(r => (
              <div key={r} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border2)' }}>
                <div className={`rating rating-${r}`} style={{ margin: '0 auto 6px', width: 32, height: 32, fontSize: 14 }}>{r}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{ratingCount[r]}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>project{ratingCount[r] !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
          {projects.map(p => {
            const spend = monthlySpend(p)
            const budget = (p.budget_annual || 0) / 12
            const pct = budget > 0 ? Math.min(100, (spend / budget) * 100) : 0
            return (
              <div key={p.id} style={{ marginBottom: 14, cursor: 'pointer' }} onClick={() => { setActiveProjectId(p.id); setPage('project-detail') }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`rating rating-${p.cost_score}`}>{p.cost_score}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--gold)' }}>{formatCost(spend)}/mo</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${pct > 90 ? 'progress-red' : pct > 70 ? 'progress-amber' : 'progress-gold'}`} style={{ width: `${pct}%` }} />
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 4 }}>{pct.toFixed(0)}% of monthly budget</div>
              </div>
            )
          })}
        </div>

        {/* Spend by model */}
        <div className="card">
          <div className="card-title">Spend by Model · This Month</div>
          {(() => {
            const byModel = {}
            projects.forEach(p => (p.services || []).forEach(s => {
              byModel[s.model] = (byModel[s.model] || 0) + s.cost_month
            }))
            const total = Object.values(byModel).reduce((a, b) => a + b, 0)
            return Object.entries(byModel).sort((a, b) => b[1] - a[1]).map(([model, spend]) => (
              <div key={model} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500 }}>{model.replace('claude-', 'Claude ').replace('gpt-', 'GPT-')}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--gold)' }}>{formatCost(spend)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill progress-gold" style={{ width: `${(spend / total) * 100}%` }} />
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3 }}>{((spend / total) * 100).toFixed(0)}% of total spend</div>
              </div>
            ))
          })()}
        </div>
      </div>

      {/* Recent alerts & recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-title">Open Alerts</div>
          {totalAlerts === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
              <i className="ti ti-circle-check" style={{ fontSize: 32, color: 'var(--green)', display: 'block', marginBottom: 8 }} />
              All guardrails passing
            </div>
          ) : (
            projects.flatMap(p => (p.alerts || []).map(a => ({ ...a, projectName: p.name }))).map(a => (
              <div key={a.id} className={`alert-item alert-${a.severity}`}>
                <i className="ti ti-alert-triangle alert-icon" />
                <div>
                  <div className="alert-title">{a.message}</div>
                  <div className="alert-body">{a.projectName}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-title">Top Recommendations</div>
          {projects.flatMap(p => (p.recommendations || []).slice(0, 1).map(r => ({ ...r, projectName: p.name }))).slice(0, 3).map(r => (
            <div key={r.id} className="rec-card">
              <i className="ti ti-bulb rec-icon" style={{ color: 'var(--gold)' }} />
              <div>
                <div className="rec-title">{r.title}</div>
                <div className="rec-body">{r.body}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>→ {r.projectName}</div>
                <span className={`rec-priority rec-${r.priority}`}>{r.priority}</span>
              </div>
            </div>
          ))}
          {projects.flatMap(p => p.recommendations || []).length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 13 }}>No recommendations at this time</div>
          )}
        </div>
      </div>
    </div>
  )
}
