import { useState, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function apiFetch(path, options = {}) {
  const r = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options })
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export function useAppState() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeProjectId, setActiveProjectId] = useState(null)

  const activeProject = projects.find(p => p.id === activeProjectId) || null

  async function loadProjects() {
    try {
      setError(null)
      const data = await apiFetch('/api/projects')
      setProjects(data)
      return data
    } catch (err) {
      console.error('[useAppState] loadProjects:', err)
      setError(err.message)
      return []
    }
  }

  useEffect(() => {
    loadProjects().finally(() => setLoading(false))
  }, [])

  const addProject = useCallback(async (payload) => {
    try {
      const newProject = await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      // Reload and update projects state, then set active project from fresh data
      const freshProjects = await apiFetch('/api/projects')
      setProjects(freshProjects)
      // Find the new project in fresh data to confirm it exists
      const found = freshProjects.find(p => p.id === newProject.id)
      if (found) setActiveProjectId(found.id)
      else setActiveProjectId(newProject.id)
      return newProject
    } catch (err) {
      console.error('[useAppState] addProject:', err)
      throw err
    }
  }, [])

  const editProject = useCallback(async (id, payload) => {
    try {
      await apiFetch(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
      await loadProjects()
    } catch (err) {
      console.error('[useAppState] editProject:', err)
      throw err
    }
  }, [])

  const removeProject = useCallback(async (id) => {
    try {
      await apiFetch(`/api/projects/${id}`, { method: 'DELETE' })
      setProjects(prev => prev.filter(p => p.id !== id))
      if (activeProjectId === id) setActiveProjectId(null)
    } catch (err) {
      console.error('[useAppState] removeProject:', err)
      throw err
    }
  }, [activeProjectId])

  const addService = useCallback(async (projectId, payload) => {
    try {
      await apiFetch('/api/services', { method: 'POST', body: JSON.stringify({ ...payload, project_id: projectId }) })
      await loadProjects()
    } catch (err) {
      console.error('[useAppState] addService:', err)
      throw err
    }
  }, [])

  const addDecision = useCallback(async (projectId, payload) => {
    try {
      await apiFetch('/api/decisions', { method: 'POST', body: JSON.stringify({ ...payload, project_id: projectId }) })
      await loadProjects()
    } catch (err) {
      console.error('[useAppState] addDecision:', err)
      throw err
    }
  }, [])

  const reload = useCallback(async () => {
    await loadProjects()
  }, [])

  return {
    projects, loading, error,
    activeProject, activeProjectId, setActiveProjectId,
    addProject, editProject, removeProject,
    addService, addDecision, reload,
  }
}
