// src/hooks/useAppState.js
import { useState, useEffect, useCallback } from 'react'
import { fetchProjects, createProject, updateProject, deleteProject, createService, createDecision } from './useApi.js'

export function useAppState() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeProjectId, setActiveProjectId] = useState(null)

  const activeProject = projects.find(p => p.id === activeProjectId) || null

  // Load all projects from Neon on mount
  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchProjects()
      setProjects(data)
    } catch (err) {
      console.error('[useAppState] loadProjects:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addProject = useCallback(async (payload) => {
    try {
      const newProject = await createProject(payload)
      await loadProjects() // reload to get enriched data
      return newProject
    } catch (err) {
      console.error('[useAppState] addProject:', err)
      throw err
    }
  }, [])

  const editProject = useCallback(async (id, payload) => {
    try {
      await updateProject(id, payload)
      await loadProjects()
    } catch (err) {
      console.error('[useAppState] editProject:', err)
      throw err
    }
  }, [])

  const removeProject = useCallback(async (id) => {
    try {
      await deleteProject(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      if (activeProjectId === id) setActiveProjectId(null)
    } catch (err) {
      console.error('[useAppState] removeProject:', err)
      throw err
    }
  }, [activeProjectId])

  const addService = useCallback(async (projectId, payload) => {
    try {
      await createService({ ...payload, project_id: projectId })
      await loadProjects()
    } catch (err) {
      console.error('[useAppState] addService:', err)
      throw err
    }
  }, [])

  const addDecision = useCallback(async (projectId, payload) => {
    try {
      await createDecision({ ...payload, project_id: projectId })
      await loadProjects()
    } catch (err) {
      console.error('[useAppState] addDecision:', err)
      throw err
    }
  }, [])

  return {
    projects,
    loading,
    error,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    addProject,
    editProject,
    removeProject,
    addService,
    addDecision,
    reload: loadProjects,
  }
}