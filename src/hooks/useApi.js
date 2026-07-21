// src/hooks/useApi.js
// All API calls to the Express backend

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function fetchProjects() {
  const r = await fetch(`${API}/api/projects`)
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function createProject(payload) {
  const r = await fetch(`${API}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function updateProject(id, payload) {
  const r = await fetch(`${API}/api/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function deleteProject(id) {
  const r = await fetch(`${API}/api/projects/${id}`, { method: 'DELETE' })
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return true
}

export async function createService(payload) {
  const r = await fetch(`${API}/api/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function updateService(id, payload) {
  const r = await fetch(`${API}/api/services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function deleteService(id) {
  const r = await fetch(`${API}/api/services/${id}`, { method: 'DELETE' })
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return true
}

export async function createGuardrail(payload) {
  const r = await fetch(`${API}/api/guardrails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function deleteGuardrail(id) {
  const r = await fetch(`${API}/api/guardrails/${id}`, { method: 'DELETE' })
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return true
}

export async function createDecision(payload) {
  const r = await fetch(`${API}/api/decisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function updateDecision(id, payload) {
  const r = await fetch(`${API}/api/decisions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function fetchPricing() {
  const r = await fetch(`${API}/api/pricing`)
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function estimateCost(payload) {
  const r = await fetch(`${API}/api/pricing/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return data.data
}

export async function askChatty({ question, page, projectId }) {
  const r = await fetch(`${API}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, page, projectId }),
  })
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return data.answer
}

export async function checkHealth() {
  try {
    const r = await fetch(`${API}/api/health`)
    return await r.json()
  } catch {
    return { status: 'error', db: 'unreachable' }
  }
}