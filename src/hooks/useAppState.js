import { useState, useCallback } from 'react'
import { PROJECTS, calcCostScore, calcArchScore, calcRiskLevel } from '../data/demo.js'

const hydrate = (projects) => projects.map(p => ({
  ...p,
  cost_score: calcCostScore(p),
  arch_score: calcArchScore(p),
  risk_level: calcRiskLevel(p),
}))

export function useAppState() {
  const [projects, setProjects] = useState(() => hydrate(PROJECTS))
  const [activeProjectId, setActiveProjectId] = useState(null)

  const activeProject = projects.find(p => p.id === activeProjectId) || null

  const addProject = useCallback((project) => {
    const newProject = {
      ...project,
      id: `proj-${Date.now()}`,
      org_id: 'org-agl',
      created_at: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString().slice(0, 10),
      services: [],
      snapshots: [],
      guardrails: [],
      alerts: [],
      recommendations: [],
      decisions: [],
    }
    const hydrated = { ...newProject, cost_score: calcCostScore(newProject), arch_score: calcArchScore(newProject), risk_level: calcRiskLevel(newProject) }
    setProjects(prev => [hydrated, ...prev])
    return hydrated
  }, [])

  const updateProject = useCallback((id, updates) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p
      const updated = { ...p, ...updates, updated_at: new Date().toISOString().slice(0, 10) }
      return { ...updated, cost_score: calcCostScore(updated), arch_score: calcArchScore(updated), risk_level: calcRiskLevel(updated) }
    }))
  }, [])

  const addService = useCallback((projectId, service) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p
      const updated = { ...p, services: [...(p.services || []), { ...service, id: `svc-${Date.now()}`, project_id: projectId, updated_at: new Date().toISOString().slice(0, 10) }] }
      return { ...updated, cost_score: calcCostScore(updated), arch_score: calcArchScore(updated), risk_level: calcRiskLevel(updated) }
    }))
  }, [])

  const addDecision = useCallback((projectId, decision) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p
      return { ...p, decisions: [...(p.decisions || []), { ...decision, id: `dec-${Date.now()}`, created_at: new Date().toISOString().slice(0, 10) }] }
    }))
  }, [])

  return { projects, activeProject, activeProjectId, setActiveProjectId, addProject, updateProject, addService, addDecision }
}
