// AI FinOps Architecture Studio — Demo Data
// Single tenant: Agentics Growth Lab

export const ORG = {
  id: 'org-agl',
  name: 'Agentics Growth Lab',
  plan: 'Enterprise',
}

export const MODELS = [
  { id: 'claude-haiku-4-5',      name: 'Claude Haiku',      provider: 'Anthropic', costPer1MIn: 0.80,  costPer1MOut: 4.00,  strengths: ['Speed','Cost','High volume'],         weaknesses: ['Complex reasoning'],        bestFor: 'Classification, routing, simple drafts' },
  { id: 'claude-sonnet-4-6',     name: 'Claude Sonnet',     provider: 'Anthropic', costPer1MIn: 4.50,  costPer1MOut: 18.00, strengths: ['Balanced','Quality','Reasoning'],     weaknesses: ['Cost at scale'],            bestFor: 'Meeting prep, email drafts, analysis' },
  { id: 'claude-opus-4-6',       name: 'Claude Opus',       provider: 'Anthropic', costPer1MIn: 15.00, costPer1MOut: 75.00, strengths: ['Highest quality','Complex tasks'],    weaknesses: ['Cost','Latency'],           bestFor: 'Architecture reviews, strategic analysis' },
  { id: 'gpt-4o',                name: 'GPT-4o',            provider: 'OpenAI',    costPer1MIn: 5.00,  costPer1MOut: 15.00, strengths: ['Vision','Multimodal','Speed'],        weaknesses: ['Cost vs Sonnet'],           bestFor: 'Vision tasks, multimodal workflows' },
  { id: 'gpt-4o-mini',           name: 'GPT-4o Mini',       provider: 'OpenAI',    costPer1MIn: 0.15,  costPer1MOut: 0.60,  strengths: ['Very cheap','Fast'],                 weaknesses: ['Quality ceiling'],          bestFor: 'High-volume simple tasks' },
  { id: 'gemini-1.5-pro',        name: 'Gemini 1.5 Pro',    provider: 'Google',    costPer1MIn: 3.50,  costPer1MOut: 10.50, strengths: ['Long context','Multimodal'],          weaknesses: ['Consistency'],              bestFor: 'Long document analysis, large context' },
]

export const PROJECTS = [
  {
    id: 'proj-advisoros',
    org_id: 'org-agl',
    name: 'AdvisorOS',
    type: 'existing',
    status: 'active',
    description: 'Enterprise AI advisor workstation — email draft generation, meeting prep, client insights',
    budget_annual: 12000,
    arch_score: 82,
    cost_score: 'B',
    risk_level: 'low',
    created_at: '2026-01-15',
    updated_at: '2026-07-20',
    services: [
      { id: 'svc-1', project_id: 'proj-advisoros', name: 'Email Draft Generation', model: 'claude-haiku-4-5', calls_day: 45, prompt_tokens: 800, completion_tokens: 400, cost_month: 42, caching_enabled: false, updated_at: '2026-07-20' },
      { id: 'svc-2', project_id: 'proj-advisoros', name: 'Meeting Prep Briefing',  model: 'claude-sonnet-4-6', calls_day: 12, prompt_tokens: 2400, completion_tokens: 1200, cost_month: 38, caching_enabled: true, updated_at: '2026-07-20' },
      { id: 'svc-3', project_id: 'proj-advisoros', name: 'Daily Brief Ranking',    model: 'claude-haiku-4-5', calls_day: 50, prompt_tokens: 600, completion_tokens: 200, cost_month: 18, caching_enabled: true, updated_at: '2026-07-20' },
    ],
    snapshots: [
      { week: 'Jul 14', spend: 88 },
      { week: 'Jul 7',  spend: 82 },
      { week: 'Jun 30', spend: 91 },
      { week: 'Jun 23', spend: 79 },
      { week: 'Jun 16', spend: 76 },
    ],
    guardrails: [
      { id: 'gr-1', type: 'monthly_ceiling',    threshold: 150,  operator: 'lte', action: 'alert',  status: 'active',  current: 98 },
      { id: 'gr-2', type: 'weekly_drift',        threshold: 15,   operator: 'lte', action: 'alert',  status: 'active',  current: 7.3 },
      { id: 'gr-3', type: 'cost_per_interaction',threshold: 0.05, operator: 'lte', action: 'alert',  status: 'active',  current: 0.031 },
      { id: 'gr-4', type: 'approved_models',     threshold: null, operator: null,  action: 'block',  status: 'active',  current: null },
      { id: 'gr-5', type: 'caching_required',    threshold: null, operator: null,  action: 'warn',   status: 'warning', current: null },
    ],
    alerts: [],
    recommendations: [
      { id: 'rec-1', category: 'cost', title: 'Enable caching on Email Draft Generation', body: 'System prompt and client context are largely static per advisor. Enabling prompt caching could reduce token costs by 30–40% on this service.', priority: 'high' },
      { id: 'rec-2', category: 'architecture', title: 'Consider Haiku for Daily Brief Ranking', body: 'Daily Brief ranking is already on Haiku — good choice. Confirm meeting prep cannot be downgraded; current Sonnet usage is appropriate given quality requirements.', priority: 'low' },
    ],
    decisions: [
      { id: 'dec-1', title: 'Use Haiku for email drafts', rationale: 'Email generation quality is sufficient with Haiku at 1/5 the cost of Sonnet. Tested both — advisor feedback was equivalent.', model_chosen: 'claude-haiku-4-5', alternatives_considered: ['claude-sonnet-4-6'], quality_impact: 'neutral', cost_impact: '-78%', risk_impact: 'low', owner: 'Nicole Martinez', status: 'approved', approval_date: '2026-02-10' },
    ],
  },
  {
    id: 'proj-eos',
    org_id: 'org-agl',
    name: 'Enterprise Platform OS (EOS)',
    type: 'existing',
    status: 'active',
    description: 'Enterprise platform governance and executive reporting system — Cloudflare Workers + KV',
    budget_annual: 3600,
    arch_score: 91,
    cost_score: 'A',
    risk_level: 'low',
    created_at: '2026-03-01',
    updated_at: '2026-07-18',
    services: [
      { id: 'svc-4', project_id: 'proj-eos', name: 'Executive Report Generation', model: 'claude-sonnet-4-6', calls_day: 3, prompt_tokens: 3200, completion_tokens: 1800, cost_month: 18, caching_enabled: true, updated_at: '2026-07-18' },
    ],
    snapshots: [
      { week: 'Jul 14', spend: 18 },
      { week: 'Jul 7',  spend: 17 },
      { week: 'Jun 30', spend: 19 },
      { week: 'Jun 23', spend: 16 },
      { week: 'Jun 16', spend: 18 },
    ],
    guardrails: [
      { id: 'gr-6', type: 'monthly_ceiling',    threshold: 50,  operator: 'lte', action: 'alert', status: 'active', current: 18 },
      { id: 'gr-7', type: 'weekly_drift',        threshold: 20,  operator: 'lte', action: 'alert', status: 'active', current: 5.9 },
    ],
    alerts: [],
    recommendations: [],
    decisions: [],
  },
]

export const GUARDRAIL_TYPES = [
  { id: 'monthly_ceiling',      label: 'Monthly Spend Ceiling',       unit: '$/month',   icon: 'ti-calendar-dollar',  description: 'Alert or block when projected monthly spend exceeds threshold' },
  { id: 'daily_ceiling',        label: 'Daily Spend Ceiling',         unit: '$/day',     icon: 'ti-coin',             description: 'Alert when daily spend exceeds threshold' },
  { id: 'weekly_drift',         label: 'Week-over-Week Drift',        unit: '%',         icon: 'ti-trending-up',      description: 'Alert when spend increases more than threshold % vs prior week' },
  { id: 'cost_per_interaction', label: 'Cost Per Interaction',        unit: '$/call',    icon: 'ti-arrows-exchange',  description: 'Alert when average cost per API call exceeds threshold' },
  { id: 'prompt_size',          label: 'Max Prompt Size',             unit: 'tokens',    icon: 'ti-file-text',        description: 'Warn when prompt tokens exceed threshold — often signals inefficiency' },
  { id: 'retry_rate',           label: 'Retry Rate Threshold',        unit: '%',         icon: 'ti-refresh',          description: 'Alert when retry rate exceeds threshold — indicates errors or quality issues' },
  { id: 'approved_models',      label: 'Approved Models Only',        unit: null,        icon: 'ti-shield-check',     description: 'Block requests to models not on the approved list' },
  { id: 'caching_required',     label: 'Caching Required',            unit: null,        icon: 'ti-database',         description: 'Warn when services with cacheable content do not have caching enabled' },
  { id: 'model_change_approval',label: 'Model Change Approval',       unit: null,        icon: 'ti-user-check',       description: 'Require human approval before any model change takes effect' },
]

export const RATING_DEFINITIONS = [
  {
    rating: 'A',
    label: 'Optimized',
    color: 'green',
    roi: '≥ 5×',
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
    rating: 'B',
    label: 'Efficient',
    color: 'blue',
    roi: '3–5×',
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
    rating: 'C',
    label: 'Needs Attention',
    color: 'amber',
    roi: '1–3×',
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
    rating: 'D',
    label: 'Critical',
    color: 'red',
    roi: '< 1×',
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

// Score calculation helpers
export function calcCostScore(project) {
  const services = project.services || []
  if (services.length === 0) return 'B'
  const totalMonthly = services.reduce((s, svc) => s + (svc.cost_month || 0), 0)
  const budget = (project.budget_annual || 12000) / 12
  const ratio = totalMonthly / budget
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
  const alerts = (project.alerts || [])
  const breaches = (project.guardrails || []).filter(g => g.status === 'breach').length
  if (alerts.some(a => a.severity === 'critical') || breaches >= 3) return 'critical'
  if (alerts.some(a => a.severity === 'warning') || breaches >= 1) return 'high'
  if ((project.guardrails || []).some(g => g.status === 'warning')) return 'medium'
  return 'low'
}

export function formatCost(n) {
  if (n >= 1000) return `$${(n/1000).toFixed(1)}k`
  return `$${n.toFixed(2)}`
}

export function monthlySpend(project) {
  return (project.services || []).reduce((s, svc) => s + (svc.cost_month || 0), 0)
}
