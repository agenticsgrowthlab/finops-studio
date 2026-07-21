import React from 'react'
import { monthlySpend, formatCost } from '../data/demo.js'

export default function Projects({ projects, setPage, setActiveProjectId }) {
  return (
    <div className="page fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">All Projects</div>
          <div className="page-sub">{projects.length} projects · Agentics Growth Lab</div>
        </div>
        <button className="btn btn-primary" onClick={() => setPage('new-project')}>
          <i className="ti ti-plus" /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <div className="empty-state-title">No projects yet</div>
          <div className="empty-state-sub">Create your first project to start tracking AI spend and preventing cost surprises.</div>
          <button className="btn btn-primary" onClick={() => setPage('new-project')}><i className="ti ti-plus" /> Create First Project</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {projects.map(p => {
            const spend = monthlySpend(p)
            const budget = (p.budget_annual || 0) / 12
            const pct = budget > 0 ? Math.min(100, (spend / budget) * 100) : 0
            const alerts = (p.alerts || []).length
            return (
              <div key={p.id} className="project-card" onClick={() => { setActiveProjectId(p.id); setPage('project-detail') }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span className={`project-type-badge ${p.type === 'existing' ? 'badge-existing' : 'badge-new'}`}>
                    <i className={`ti ${p.type === 'existing' ? 'ti-chart-bar' : 'ti-sparkles'}`} style={{ fontSize: 10 }} />
                    {p.type === 'existing' ? 'Existing' : 'New'}
                  </span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`rating rating-${p.cost_score}`}>{p.cost_score}</span>
                    <span className={`risk risk-${p.risk_level}`}><span className="dot" />{p.risk_level}</span>
                  </div>
                </div>

                <div className="project-name">{p.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>{p.description}</div>

                <div className="project-spend">{formatCost(spend)}<span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'inherit', fontWeight: 400 }}>/mo</span></div>
                <div className="project-spend-label">Annual forecast {formatCost(spend * 12)} · Budget {formatCost(p.budget_annual || 0)}</div>

                <div className="progress-bar" style={{ marginBottom: 8 }}>
                  <div className={`progress-fill ${pct > 90 ? 'progress-red' : pct > 70 ? 'progress-amber' : 'progress-gold'}`} style={{ width: `${pct}%` }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--muted)' }}><i className="ti ti-database" style={{ fontSize: 11 }} /> {(p.services || []).length} services</span>
                    <span style={{ fontSize: 11.5, color: 'var(--muted)' }}><i className="ti ti-shield-check" style={{ fontSize: 11 }} /> {(p.guardrails || []).length} guardrails</span>
                  </div>
                  {alerts > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--red-bg)', color: '#F87171', padding: '2px 8px', borderRadius: 4 }}>
                      {alerts} alert{alerts !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Updated {p.updated_at}</span>
                  <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>View details →</span>
                </div>
              </div>
            )
          })}

          {/* Add new card */}
          <div
            onClick={() => setPage('new-project')}
            style={{ border: '2px dashed rgba(212,185,106,0.2)', borderRadius: 'var(--radius-lg)', padding: 24, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 200, transition: 'border-color 0.2s' }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(212,185,106,0.5)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(212,185,106,0.2)'}
          >
            <i className="ti ti-plus" style={{ fontSize: 28, color: 'var(--gold)', opacity: 0.6 }} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--muted)' }}>Add Project</span>
          </div>
        </div>
      )}
    </div>
  )
}
