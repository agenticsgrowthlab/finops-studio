import React from 'react'

export default function Sidebar({ page, setPage, projects, activeProjectId, setActiveProjectId, alertCount = 0 }) {
  const [activeCollapsed, setActiveCollapsed] = React.useState(false)
  function nav(p, projId = null) {
    setPage(p)
    if (projId !== null) setActiveProjectId(projId)
  }

  const isActive = (p) => page === p

  return (
    <nav className="sidebar">
      <div className="sidebar-logo" onClick={() => nav('dashboard')} style={{ cursor: 'pointer' }}>
        <div className="sidebar-logo-title">AI FinOps<br />Architecture Studio</div>
        <div className="sidebar-logo-sub">v1.0 · Beta</div>
      </div>

      <div className="sidebar-org">
        <span className="sidebar-org-dot" />
        <span className="sidebar-org-name">Agentics Growth Lab</span>
      </div>

      <div className="sidebar-nav">
        {/* Overview */}
        <div className="sidebar-section-label">Overview</div>
        <button className={`sidebar-link ${isActive('dashboard') ? 'active' : ''}`} onClick={() => nav('dashboard')}>
          <i className="ti ti-layout-dashboard" />
          Dashboard
          {alertCount > 0 && <span className="badge">{alertCount}</span>}
        </button>

        {/* Projects */}
        <div className="sidebar-section-label">Projects</div>
        <button className={`sidebar-link ${isActive('projects') ? 'active' : ''}`} onClick={() => nav('projects')}>
          <i className="ti ti-folder" />
          All Projects
        </button>
        <button className={`sidebar-link ${isActive('new-project') ? 'active' : ''}`} onClick={() => nav('new-project')}>
          <i className="ti ti-plus" />
          New Project
        </button>

        {/* Active projects */}
        {projects.length > 0 && (
          <>
            <button
              onClick={() => setActiveCollapsed(c => !c)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 20px 6px', marginTop: 8 }}
            >
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Active ({projects.filter(p => p.status === 'active').length})
              </span>
              <i className={`ti ${activeCollapsed ? 'ti-chevron-down' : 'ti-chevron-up'}`} style={{ fontSize: 11, color: 'var(--muted)' }} />
            </button>
            {!activeCollapsed && [...projects].filter(p => p.status === 'active').sort((a,b) => a.name.localeCompare(b.name)).map(p => (
              <button
                key={p.id}
                className={`sidebar-link ${page === 'project-detail' && activeProjectId === p.id ? 'active' : ''}`}
                onClick={() => nav('project-detail', p.id)}
                style={{ paddingLeft: 28 }}
              >
                <i className={`ti ${p.type === 'existing' ? 'ti-chart-bar' : 'ti-sparkles'}`} style={{ fontSize: 13 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12.5 }}>{p.name}</span>
                <span className={`rating rating-${p.cost_score}`} style={{ marginLeft: 'auto', width: 20, height: 20, fontSize: 10 }}>{p.cost_score}</span>
              </button>
            ))}
          </>
        )}

        {/* Tools */}
        <div className="sidebar-section-label" style={{ marginTop: 8 }}>Tools</div>
        <button className={`sidebar-link ${isActive('alerts') ? 'active' : ''}`} onClick={() => nav('alerts')}>
          <i className="ti ti-bell" />
          Alerts
          {alertCount > 0 && <span className="badge">{alertCount}</span>}
        </button>
        <button className={`sidebar-link ${isActive('forecasting') ? 'active' : ''}`} onClick={() => nav('forecasting')}>
          <i className="ti ti-trending-up" />
          Forecasting
        </button>
        <button className={`sidebar-link ${isActive('arch-reviews') ? 'active' : ''}`} onClick={() => nav('arch-reviews')}>
          <i className="ti ti-topology-star" />
          Architecture Reviews
        </button>
        <button className={`sidebar-link ${isActive('scenario') ? 'active' : ''}`} onClick={() => nav('scenario')}>
          <i className="ti ti-adjustments-horizontal" />
          Scenario Planning
        </button>


        {/* Spend Leadership */}
        <div className="sidebar-section-label" style={{ marginTop: 8 }}>Spend Leadership</div>
        <button className={`sidebar-link ${isActive('reports') ? 'active' : ''}`} onClick={() => nav('reports')}>
          <i className="ti ti-presentation" />
          Leadership Reports
        </button>
        <button className={`sidebar-link ${isActive('onboarding') ? 'active' : ''}`} onClick={() => nav('onboarding')}>
          <i className="ti ti-list-check" />
          Onboarding Plan
        </button>
        <button className={`sidebar-link ${isActive('journal') ? 'active' : ''}`} onClick={() => nav('journal')}>
          <i className="ti ti-notebook" />
          Journal
        </button>

        {/* Reference */}
        <div className="sidebar-section-label" style={{ marginTop: 8 }}>Reference</div>
        <button className={`sidebar-link ${isActive('guardrails') ? 'active' : ''}`} onClick={() => nav('guardrails')}>
          <i className="ti ti-shield-check" />
          Guardrail Definitions
        </button>
        <button className={`sidebar-link ${isActive('finops-foundation') ? 'active' : ''}`} onClick={() => nav('finops-foundation')}>
          <i className="ti ti-certificate" />
          FinOps Foundation
        </button>
        <button className={`sidebar-link ${isActive('how-to-use') ? 'active' : ''}`} onClick={() => nav('how-to-use')}>
          <i className="ti ti-book" />
          How to Use
        </button>
        <button className={`sidebar-link ${isActive('settings') ? 'active' : ''}`} onClick={() => nav('settings')}>
          <i className="ti ti-settings" />
          Settings
        </button>
      </div>

      <div className="sidebar-footer">
        AI recommends · Humans approve<br />
        <span style={{ opacity: 0.5 }}>FinOps Foundation aligned</span>
      </div>
    </nav>
  )
}