// AI FinOps Architecture Studio — Demo Data
// Static reference data only — projects now come from Neon via API

export const ORG = {
  id: 'org-agl',
  name: 'Agentics Growth Lab',
  plan: 'Enterprise',
}

export const MODELS = [
  { id: 'claude-haiku-4-5',  name: 'Claude Haiku',     provider: 'Anthropic', costPer1MIn: 0.80,  costPer1MOut: 4.00,  strengths: ['Speed','Cost','High volume'],       weaknesses: ['Complex reasoning'],   bestFor: 'Classification, routing, simple drafts' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet',    provider: 'Anthropic', costPer1MIn: 4.50,  costPer1MOut: 18.00, strengths: ['Balanced','Quality','Reasoning'],   weaknesses: ['Cost at scale'],       bestFor: 'Meeting prep, email drafts, analysis' },
  { id: 'claude-opus-4-6',   name: 'Claude Opus',      provider: 'Anthropic', costPer1MIn: 15.00, costPer1MOut: 75.00, strengths: ['Highest quality','Complex tasks'],  weaknesses: ['Cost','Latency'],      bestFor: 'Architecture reviews, strategic analysis' },
  { id: 'gpt-4o',            name: 'GPT-4o',           provider: 'OpenAI',    costPer1MIn: 5.00,  costPer1MOut: 15.00, strengths: ['Vision','Multimodal','Speed'],      weaknesses: ['Cost vs Sonnet'],      bestFor: 'Vision tasks, multimodal workflows' },
  { id: 'gpt-4o-mini',       name: 'GPT-4o Mini',      provider: 'OpenAI',    costPer1MIn: 0.15,  costPer1MOut: 0.60,  strengths: ['Very cheap','Fast'],                weaknesses: ['Quality ceiling'],     bestFor: 'High-volume simple tasks' },
  { id: 'gemini-1.5-pro',    name: 'Gemini 1.5 Pro',   provider: 'Google',    costPer1MIn: 3.50,  costPer1MOut: 10.50, strengths: ['Long context','Multimodal'],         weaknesses: ['Consistency'],         bestFor: 'Long document analysis, large context' },
]

export const GUARDRAIL_TYPES = [
  { id: 'monthly_ceiling',       label: 'Monthly Spend Ceiling',    unit: '$/month', icon: 'ti-calendar-dollar', description: 'Alert or block when projected monthly spend exceeds threshold' },
  { id: 'daily_ceiling',         label: 'Daily Spend Ceiling',      unit: '$/day',   icon: 'ti-coin',            description: 'Alert when daily spend exceeds threshold' },
  { id: 'weekly_drift',          label: 'Week-over-Week Drift',     unit: '%',       icon: 'ti-trending-up',     description: 'Alert when spend increases more than threshold % vs prior week' },
  { id: 'cost_per_interaction',  label: 'Cost Per Interaction',     unit: '$/call',  icon: 'ti-arrows-exchange', description: 'Alert when average cost per API call exceeds threshold' },
  { id: 'prompt_size',           label: 'Max Prompt Size',          unit: 'tokens',  icon: 'ti-file-text',       description: 'Warn when prompt tokens exceed threshold — often signals inefficiency' },
  { id: 'retry_rate',            label: 'Retry Rate Threshold',     unit: '%',       icon: 'ti-refresh',         description: 'Alert when retry rate exceeds threshold' },
  { id: 'approved_models',       label: 'Approved Models Only',     unit: null,      icon: 'ti-shield-check',    description: 'Block requests to models not on the approved list' },
  { id: 'caching_required',      label: 'Caching Required',         unit: null,      icon: 'ti-database',        description: 'Warn when services with cacheable content do not have caching enabled' },
  { id: 'model_change_approval', label: 'Model Change Approval',    unit: null,      icon: 'ti-user-check',      description: 'Require human approval before any model change takes effect' },
]

export const RATING_DEFINITIONS = [
  {
    rating: 'A', label: 'Optimized', color: 'green', roi: '≥ 5×',
    description: 'AI spend is generating excellent return. Architecture is well-designed.',
    behaviors: [
      'Caching enabled on all cacheable services',
      'Deterministic retrieval used where possible instead of LLM reasoning',
      'Model selection matches task complexity — not over-engineered',
      'All guardrails green, no active alerts',
      'Cost per interaction within target range',
    ],
    triggers: 'All guardrails passing, ROI ≥ 5×, no drift >10%',
    action: 'Maintain. Review quarterly.',
  },
  {
    rating: 'B', label: 'Efficient', color: 'blue', roi: '3–5×',
    description: 'Good AI spend efficiency with room for improvement.',
    behaviors: [
      'Most guardrails passing with 1–2 amber warnings',
      'Minor drift detected but within acceptable range',
      'Some optimization opportunities identified',
      'Caching partially implemented',
    ],
    triggers: '1–2 guardrail warnings, drift 10–20%, ROI 3–5×',
    action: 'Review amber guardrails. Implement quick wins.',
  },
  {
    rating: 'C', label: 'Needs Attention', color: 'amber', roi: '1–3×',
    description: 'AI spend efficiency is below target. Architecture review recommended.',
    behaviors: [
      'Multiple guardrail breaches',
      'Model choices may be over-powered for the use case',
      'Caching not implemented on cacheable services',
      'Prompt sizes larger than necessary',
      'Significant week-over-week drift',
    ],
    triggers: '3+ guardrail warnings, drift >20%, ROI 1–3×',
    action: 'Schedule architecture review within 2 weeks.',
  },
  {
    rating: 'D', label: 'Critical', color: 'red', roi: '< 1×',
    description: 'AI spend is not generating sufficient return. Immediate action required.',
    behaviors: [
      'Multiple guardrails breached',
      'Unexplained spend increases',
      'No caching, no retrieval strategy',
      'Using expensive models for simple tasks',
      'High retry rates indicating quality or reliability issues',
    ],
    triggers: 'ROI < 1×, multiple critical alerts, spend ceiling breached',
    action: 'Immediate architecture review required. Escalate to leadership.',
  },
]

// ── Utility functions — always coerce to Number (Postgres returns strings) ────

export function formatCost(n) {
  const num = Number(n) || 0
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`
  return `$${num.toFixed(2)}`
}

export function monthlySpend(project) {
  return (project.services || []).reduce((s, svc) => s + (Number(svc.cost_month) || 0), 0)
}

export function calcCostScore(project) {
  const services = project.services || []
  if (services.length === 0) return 'B'
  const totalMonthly = services.reduce((s, svc) => s + (Number(svc.cost_month) || 0), 0)
  const budget = (Number(project.budget_annual) || 12000) / 12
  const ratio = budget > 0 ? totalMonthly / budget : 0
  const cachingPct = services.filter(s => s.caching_enabled).length / services.length
  const guardrails = project.guardrails || []
  const breaches = guardrails.filter(g => g.status === 'breach').length
  const warnings = guardrails.filter(g => g.status === 'warning').length
  if (ratio < 0.5 && cachingPct >= 0.5 && breaches === 0) return 'A'
  if (ratio < 0.75 && breaches === 0 && warnings <= 1) return 'B'
  if (ratio < 1.0 && breaches <= 1) return 'C'
  return 'D'
}

export function calcArchScore(project) {
  let score = 100
  const services = project.services || []
  const cachingPct = services.length > 0 ? services.filter(s => s.caching_enabled).length / services.length : 0
  if (cachingPct < 0.5) score -= 12
  const guardrails = project.guardrails || []
  score -= guardrails.filter(g => g.status === 'breach').length * 10
  score -= guardrails.filter(g => g.status === 'warning').length * 5
  const alerts = project.alerts || []
  score -= alerts.filter(a => a.severity === 'critical').length * 15
  score -= alerts.filter(a => a.severity === 'warning').length * 5
  return Math.max(0, Math.min(100, score))
}

export function calcRiskLevel(project) {
  const alerts = project.alerts || []
  const breaches = (project.guardrails || []).filter(g => g.status === 'breach').length
  if (alerts.some(a => a.severity === 'critical') || breaches >= 3) return 'critical'
  if (alerts.some(a => a.severity === 'warning') || breaches >= 1) return 'high'
  if ((project.guardrails || []).some(g => g.status === 'warning')) return 'medium'
  return 'low'
}