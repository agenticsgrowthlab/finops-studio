import { Router } from 'express'
import { pool } from '../server.js'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()

// POST /api/chat
// Body: { question, page, projectId }
// Claude explains facts from Neon — never invents numbers
router.post('/', async (req, res) => {
  try {
    const { question, page, projectId } = req.body
    if (!question) return res.status(400).json({ success: false, error: 'question required' })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return res.status(503).json({ success: false, error: 'AI not configured', code: 'NO_API_KEY' })

    // ── Fetch context from Neon based on page/project ─────────────────────────
    let context = {}

    if (projectId) {
      // Project-level context
      const [project, services, guardrails, alerts, snapshots, recommendations, decisions, pricing] = await Promise.all([
        pool.query(`SELECT * FROM projects WHERE id = $1`, [projectId]),
        pool.query(`SELECT * FROM services WHERE project_id = $1 ORDER BY cost_month DESC`, [projectId]),
        pool.query(`SELECT * FROM guardrails WHERE project_id = $1`, [projectId]),
        pool.query(`SELECT * FROM alerts WHERE project_id = $1 AND resolved_at IS NULL ORDER BY triggered_at DESC`, [projectId]),
        pool.query(`SELECT * FROM snapshots WHERE project_id = $1 ORDER BY captured_at DESC LIMIT 6`, [projectId]),
        pool.query(`SELECT * FROM recommendations WHERE project_id = $1 AND status = 'open'`, [projectId]),
        pool.query(`SELECT * FROM decisions WHERE project_id = $1 ORDER BY created_at DESC LIMIT 5`, [projectId]),
        pool.query(`SELECT * FROM model_pricing WHERE deprecated_at IS NULL ORDER BY cost_per_1m_input`),
      ])

      const p = project.rows[0]
      const svcs = services.rows
      const totalMonthly = svcs.reduce((s, svc) => s + Number(svc.cost_month || 0), 0)

      context = {
        scope: 'project',
        project: {
          name: p?.name,
          type: p?.type,
          status: p?.status,
          description: p?.description,
          budget_annual: p?.budget_annual,
          budget_monthly: p?.budget_annual ? Number(p.budget_annual) / 12 : null,
          arch_score: p?.arch_score,
          cost_score: p?.cost_score,
          risk_level: p?.risk_level,
        },
        spend: {
          total_monthly: totalMonthly,
          annual_forecast: totalMonthly * 12,
          budget_variance_pct: p?.budget_annual
            ? ((totalMonthly * 12 - Number(p.budget_annual)) / Number(p.budget_annual) * 100).toFixed(1)
            : null,
        },
        services: svcs.map(s => ({
          name: s.name,
          model: s.model_id,
          calls_per_day: s.calls_per_day,
          prompt_tokens: s.prompt_tokens_avg,
          completion_tokens: s.completion_tokens_avg,
          cost_month: s.cost_month,
          caching_enabled: s.caching_enabled,
        })),
        guardrails: guardrails.rows.map(g => ({
          type: g.type,
          label: g.label,
          threshold: g.threshold,
          current_value: g.current_value,
          status: g.status,
          action: g.action,
        })),
        alerts: alerts.rows.map(a => ({
          severity: a.severity,
          message: a.message,
          triggered_at: a.triggered_at,
        })),
        spend_trend: snapshots.rows.map(s => ({
          period: s.period_label,
          spend: s.spend,
        })),
        recommendations: recommendations.rows.map(r => ({
          category: r.category,
          title: r.title,
          body: r.body,
          priority: r.priority,
        })),
        recent_decisions: decisions.rows.map(d => ({
          title: d.title,
          model_chosen: d.model_chosen,
          cost_impact: d.cost_impact,
          status: d.status,
        })),
        available_models: pricing.rows.map(m => ({
          model_id: m.model_id,
          name: m.display_name,
          provider: m.provider,
          cost_per_1m_input: m.cost_per_1m_input,
          cost_per_1m_output: m.cost_per_1m_output,
          best_for: m.best_for,
        })),
      }
    } else {
      // Portfolio-level context (dashboard)
      const orgResult = await pool.query(`SELECT id FROM organizations WHERE name = 'Agentics Growth Lab' LIMIT 1`)
      const orgId = orgResult.rows[0]?.id

      const [projects, pricing] = await Promise.all([
        pool.query(`SELECT * FROM projects WHERE org_id = $1 AND status = 'active'`, [orgId]),
        pool.query(`SELECT * FROM model_pricing WHERE deprecated_at IS NULL ORDER BY cost_per_1m_input`),
      ])

      const projectsWithSpend = await Promise.all(projects.rows.map(async (p) => {
        const svcs = await pool.query(`SELECT * FROM services WHERE project_id = $1`, [p.id])
        const guards = await pool.query(`SELECT * FROM guardrails WHERE project_id = $1`, [p.id])
        const alerts = await pool.query(`SELECT * FROM alerts WHERE project_id = $1 AND resolved_at IS NULL`, [p.id])
        const totalMonthly = svcs.rows.reduce((s, svc) => s + Number(svc.cost_month || 0), 0)
        return {
          name: p.name,
          type: p.type,
          cost_score: p.cost_score,
          risk_level: p.risk_level,
          arch_score: p.arch_score,
          budget_annual: p.budget_annual,
          monthly_spend: totalMonthly,
          annual_forecast: totalMonthly * 12,
          service_count: svcs.rows.length,
          open_alerts: alerts.rows.length,
          guardrail_warnings: guards.rows.filter(g => g.status === 'warning').length,
          guardrail_breaches: guards.rows.filter(g => g.status === 'breach').length,
        }
      }))

      const totalMonthly = projectsWithSpend.reduce((s, p) => s + p.monthly_spend, 0)
      const totalBudget  = projectsWithSpend.reduce((s, p) => s + Number(p.budget_annual || 0), 0)

      context = {
        scope: 'portfolio',
        organization: 'Agentics Growth Lab',
        summary: {
          total_monthly_spend: totalMonthly,
          annual_forecast: totalMonthly * 12,
          total_annual_budget: totalBudget,
          budget_variance_pct: totalBudget > 0
            ? ((totalMonthly * 12 - totalBudget) / totalBudget * 100).toFixed(1)
            : null,
          active_projects: projectsWithSpend.length,
          total_open_alerts: projectsWithSpend.reduce((s, p) => s + p.open_alerts, 0),
        },
        projects: projectsWithSpend,
        available_models: pricing.rows.map(m => ({
          model_id: m.model_id,
          name: m.display_name,
          provider: m.provider,
          cost_per_1m_input: m.cost_per_1m_input,
          cost_per_1m_output: m.cost_per_1m_output,
          best_for: m.best_for,
        })),
      }
    }

    // ── Build prompt for Claude ────────────────────────────────────────────────
    const systemPrompt = `You are FinOps Chatty, an AI assistant inside the AI FinOps Architecture Studio.

Your role is to EXPLAIN financial and architectural facts using the data provided to you.

CRITICAL RULES:
- NEVER invent numbers, costs, percentages, or projections
- ONLY reference data provided in the context below
- If data is not in the context, say "I don't have that information in the current data"
- The application calculates all math — you explain what those calculations mean
- Be concise, clear, and executive-ready in your language
- When referencing costs, always cite which service or model they come from
- Speak as a trusted FinOps advisor, not as a chatbot

Current page context: ${page || 'dashboard'}
${projectId ? `Current project: ${context.project?.name}` : 'Viewing: Portfolio Dashboard'}

DATA CONTEXT:
${JSON.stringify(context, null, 2)}

Answer the user's question using ONLY the data above. If asked about scenarios (e.g. "what if usage doubles"), 
you may perform simple arithmetic on the numbers provided but must show your work and label it as a scenario calculation.`

    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    })

    const answer = response.content[0]?.text || 'I was unable to generate a response.'

    res.json({
      success: true,
      answer,
      context_scope: context.scope,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      }
    })

  } catch (err) {
    console.error('[chat POST]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router