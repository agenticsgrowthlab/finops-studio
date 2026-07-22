import React, { useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Alerts({ projects, reload }) {
  const [resolving, setResolving] = useState(null)
  const [filter, setFilter] = useState('all')

  // Collect all alerts + guardrail warnings across all projects
  const allAlerts = projects.flatMap(p => [
    ...(p.alerts || []).map(a => ({ ...a, projectName: p.name, projectId: p.id, source: 'alert' })),
    ...(p.guardrails || [])
      .filter(g => g.status === 'warning' || g.status === 'breach')
      .map(g => ({
        id: `gr-${g.id}`,
        projectName: p.name,
        projectId: p.id,
        severity: g.status === 'breach' ? 'critical' : 'warning',
        message: `${g.label}: ${g.status === 'breach' ? 'Threshold breached' : 'Approaching threshold'}`,
        detail: g.threshold ? `Threshold: ${g.threshold} · Current: ${g.current_value || 'unknown'}` : null,
        triggered_at: g.updated_at,
        source: 'guardrail',
        guardrail_id: g.id,
      }))
  ]).sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 }
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2)
  })

  const filtered = filter === 'all' ? allAlerts : allAlerts.filter(a => a.severity === filter)
  const criticalCount = allAlerts.filter(a => a.severity === 'critical').length
  const warningCount = allAlerts.filter(a => a.severity === 'warning').length

  async function handleResolve(alert) {
    if (alert.source !== 'alert') return
    setResolving(alert.id)
    try {
      await fetch(`${API}/api/alerts/${alert.id}/resolve`, { method: 'PATCH' })
      if (reload) reload()
    } catch (err) {
      alert('Error resolving alert: ' + err.message)
    } finally {
      setResolving(null)
    }
  }

  return (
    <div className="page fade-in">
      <div className="page-sub" style={{ marginBottom: 24 }}>All active alerts and guardrail warnings across your portfolio</div>

      {/* Summary */}
      <div className="stat-grid stat-grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Active</div>
          <div className="stat-value" style={{ fontSize: 32, color: allAlerts.length > 0 ? 'var(--amber)' : 'var(--green)' }}>{allAlerts.length}</div>
          <div className="stat-sub">{allAlerts.length === 0 ? 'All clear ✓' : 'Require attention'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Critical</div>
          <div className="stat-value" style={{ fontSize: 32, color: criticalCount > 0 ? 'var(--red)' : 'var(--green)' }}>{criticalCount}</div>
          <div className="stat-sub">Immediate action needed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Warnings</div>
          <div className="stat-value" style={{ fontSize: 32, color: warningCount > 0 ? 'var(--amber)' : 'var(--green)' }}>{warningCount}</div>
          <div className="stat-sub">Monitor closely</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'critical', 'warning', 'info'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>
            {f === 'all' ? `All (${allAlerts.length})` : `${f} (${allAlerts.filter(a => a.severity === f).length})`}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-title">
            {filter === 'all' ? 'All guardrails passing' : `No ${filter} alerts`}
          </div>
          <div className="empty-state-sub">
            {filter === 'all'
              ? 'All projects are within their guardrail thresholds. Weekly spend snapshots will surface drift before it compounds.'
              : `No ${filter} level alerts at this time.`}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(a => (
            <div key={a.id} style={{
              background: 'var(--card)',
              border: `1px solid ${a.severity === 'critical' ? 'rgba(184,50,50,0.4)' : a.severity === 'warning' ? 'rgba(217,119,6,0.4)' : 'rgba(46,117,182,0.4)'}`,
              borderLeft: `4px solid ${a.severity === 'critical' ? 'var(--red)' : a.severity === 'warning' ? 'var(--amber)' : 'var(--steel)'}`,
              borderRadius: 10, padding: '14px 18px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
                    background: a.severity === 'critical' ? 'var(--red-bg)' : a.severity === 'warning' ? 'var(--amber-bg)' : 'rgba(46,117,182,0.1)',
                    color: a.severity === 'critical' ? '#F87171' : a.severity === 'warning' ? '#FCD34D' : '#60A5FA',
                  }}>{a.severity}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{a.message}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    <i className="ti ti-folder" style={{ fontSize: 11, marginRight: 4 }} />{a.projectName}
                  </span>
                  {a.detail && (
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{a.detail}</span>
                  )}
                  {a.triggered_at && (
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      <i className="ti ti-clock" style={{ fontSize: 11, marginRight: 4 }} />
                      {new Date(a.triggered_at).toLocaleDateString()}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
                    {a.source === 'guardrail' ? 'Guardrail' : 'Alert'}
                  </span>
                </div>
              </div>
              {a.source === 'alert' && !a.resolved_at && (
                <button
                  onClick={() => handleResolve(a)}
                  disabled={resolving === a.id}
                  className="btn btn-ghost btn-sm"
                  style={{ flexShrink: 0 }}
                >
                  <i className={`ti ${resolving === a.id ? 'ti-loader' : 'ti-check'}`} />
                  {resolving === a.id ? 'Resolving...' : 'Resolve'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Email alert note */}
      <div style={{ marginTop: 24, padding: '14px 18px', background: 'rgba(46,117,182,0.06)', border: '1px solid rgba(46,117,182,0.2)', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
        <i className="ti ti-mail" style={{ fontSize: 20, color: 'var(--steel)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Email Alerts — Coming Soon</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Gmail integration will send automated alerts when guardrails breach. For now, check this page regularly or take a weekly spend snapshot to surface drift.</div>
        </div>
      </div>
    </div>
  )
}
