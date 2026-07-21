import React, { useState } from 'react'
import './styles/global.css'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Projects from './pages/Projects.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import NewProject from './pages/NewProject.jsx'
import GuardrailDefinitions from './pages/GuardrailDefinitions.jsx'
import { ArchReviews, ScenarioPlanning, LeadershipReports, Settings } from './pages/OtherPages.jsx'
import { useAppState } from './hooks/useAppState.js'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const { projects, activeProject, activeProjectId, setActiveProjectId, addProject, updateProject, addService, addDecision } = useAppState()

  const alertCount = projects.reduce((s, p) => s + (p.alerts || []).length, 0)

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

  const PAGE_TITLES = {
    dashboard:      'Dashboard',
    projects:       'All Projects',
    'new-project':  'New Project',
    'project-detail': activeProject?.name || 'Project',
    'arch-reviews': 'Architecture Reviews',
    scenario:       'Scenario Planning',
    reports:        'Leadership Reports',
    guardrails:     'Guardrail Definitions',
    settings:       'Settings',
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        setPage={setPage}
        projects={projects}
        activeProjectId={activeProjectId}
        setActiveProjectId={setActiveProjectId}
        alertCount={alertCount}
      />
      <div className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-title">{PAGE_TITLES[page] || 'AI FinOps Architecture Studio'}</div>
          <div className="topbar-right">
            <span className="topbar-date">{today}</span>
            {alertCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-bg)', border: '1px solid rgba(184,50,50,0.4)', borderRadius: 20, padding: '3px 10px', cursor: 'pointer' }} onClick={() => setPage('dashboard')}>
                <i className="ti ti-alert-triangle" style={{ fontSize: 13, color: '#F87171' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#F87171' }}>{alertCount} alert{alertCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            <button onClick={() => setPage('settings')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '6px' }}>
              <i className="ti ti-settings" style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        {/* Pages */}
        {page === 'dashboard'       && <Dashboard projects={projects} setPage={setPage} setActiveProjectId={setActiveProjectId} />}
        {page === 'projects'        && <Projects projects={projects} setPage={setPage} setActiveProjectId={setActiveProjectId} />}
        {page === 'new-project'     && <NewProject addProject={addProject} setPage={setPage} setActiveProjectId={setActiveProjectId} />}
        {page === 'project-detail'  && <ProjectDetail project={activeProject} setPage={setPage} addService={addService} addDecision={addDecision} />}
        {page === 'arch-reviews'    && <ArchReviews projects={projects} />}
        {page === 'scenario'        && <ScenarioPlanning projects={projects} />}
        {page === 'reports'         && <LeadershipReports projects={projects} />}
        {page === 'guardrails'      && <GuardrailDefinitions />}
        {page === 'settings'        && <Settings />}
      </div>
    </div>
  )
}
