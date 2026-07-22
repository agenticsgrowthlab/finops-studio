// api/routes/projects.js
import { Router } from 'express'
import { pool, getOrgId } from '../server.js'

const router = Router()

// ── Scoring helpers (all math here, never Claude) ─────────────────────────────
function calcCostScore(services, budget_annual) {
  if (!services || services.length === 0) return 'B'
  const totalMonthly = services.reduce((s, svc) => s + Number(svc.cost_month || 0), 0)
  const budget = (Number(budget_annual) || 12000) / 12
  const ratio = budget > 0 ? totalMonthly / budget : 0
  const cachingPct = services.filter(s => s.caching_enabled).length / services.length
  if (ratio < 0.5 && cachingPct >= 0.5) return 'A'
  if (ratio < 0.75) return 'B'
  if (ratio < 1.0)  return 'C'
  return 'D'
}

function calcArchScore(services, guardrails) {
  let score = 100
  const cachingPct = services.length > 0
    ? services.filter(s => s.caching_enabled).length / services.length
    : 1
  if (cachingPct < 0.5) score -= 12
  score -= (guardrails || []).filter(g => g.status === 'breach').length * 10
  score -= (guardrails || []).filter(g => g.status === 'warning').length * 5
  return Math.max(0, Math.min(100, score))
}

function calcRiskLevel(guardrails, alerts) {
  const breaches = (guardrails || []).filter(g => g.status === 'breach').length
  const criticalAlerts = (alerts || []).filter(a => a.severity === 'critical').length
  if (criticalAlerts > 0 || breaches >= 3) return 'critical'
  if (breaches >= 1) return 'high'
  if ((guardrails || []).some(g => g.status === 'warning')) return 'medium'
  return 'low'
}

// ── GET /api/projects — list all projects with full context ───────────────────
router.get('/', async (req, res) => {
  try {
    const orgId = await getOrgId()

    const projects = await pool.query(
      `SELECT * FROM projects WHERE org_id = $1 ORDER BY updated_at DESC`,
      [orgId]
    )

    const enriched = await Promise.all(projects.rows.map(async (p) => {
      const [services, guardrails, alerts, snapshots, recommendations, decisions] = await Promise.all([
        pool.query(`SELECT * FROM services WHERE project_id = $1 ORDER BY created_at`, [p.id]),
        pool.query(`SELECT * FROM guardrails WHERE project_id = $1 ORDER BY created_at`, [p.id]),
        pool.query(`SELECT * FROM alerts WHERE project_id = $1 AND resolved_at IS NULL ORDER BY triggered_at DESC`, [p.id]),
        pool.query(`SELECT * FROM snapshots WHERE project_id = $1 ORDER BY captured_at DESC LIMIT 8`, [p.id]),
        pool.query(`SELECT * FROM recommendations WHERE project_id = $1 AND status = 'open' ORDER BY priority, created_at`, [p.id]),
        pool.query(`SELECT * FROM decisions WHERE project_id = $1 ORDER BY created_at DESC`, [p.id]),
      ])

      const costScore = calcCostScore(services.rows, p.budget_annual)
      const archScore = calcArchScore(services.rows, guardrails.rows)
      const riskLevel = calcRiskLevel(guardrails.rows, alerts.rows)

      return {
        ...p,
        cost_score: costScore,
        arch_score: archScore,
        risk_level: riskLevel,
        services: services.rows,
        guardrails: guardrails.rows,
        alerts: alerts.rows,
        snapshots: snapshots.rows,
        recommendations: recommendations.rows,
        decisions: decisions.rows,
      }
    }))

    res.json({ success: true, data: enriched })
  } catch (err) {
    console.error('[projects GET]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── GET /api/projects/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const p = await pool.query(`SELECT * FROM projects WHERE id = $1`, [id])
    if (!p.rows[0]) return res.status(404).json({ success: false, error: 'Project not found' })

    const [services, guardrails, alerts, snapshots, recommendations, decisions, budgets, estimates, archReviews] = await Promise.all([
      pool.query(`SELECT * FROM services WHERE project_id = $1 ORDER BY created_at`, [id]),
      pool.query(`SELECT * FROM guardrails WHERE project_id = $1 ORDER BY created_at`, [id]),
      pool.query(`SELECT * FROM alerts WHERE project_id = $1 AND resolved_at IS NULL ORDER BY triggered_at DESC`, [id]),
      pool.query(`SELECT * FROM snapshots WHERE project_id = $1 ORDER BY captured_at DESC LIMIT 8`, [id]),
      pool.query(`SELECT * FROM recommendations WHERE project_id = $1 ORDER BY status, priority, created_at`, [id]),
      pool.query(`SELECT * FROM decisions WHERE project_id = $1 ORDER BY created_at DESC`, [id]),
      pool.query(`SELECT * FROM budgets WHERE project_id = $1 ORDER BY year DESC`, [id]),
      pool.query(`SELECT * FROM estimates WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`, [id]),
      pool.query(`SELECT * FROM architecture_reviews WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`, [id]),
    ])

    const project = p.rows[0]
    const costScore = calcCostScore(services.rows, project.budget_annual)
    const archScore = calcArchScore(services.rows, guardrails.rows)
    const riskLevel = calcRiskLevel(guardrails.rows, alerts.rows)

    res.json({
      success: true,
      data: {
        ...project,
        cost_score: costScore,
        arch_score: archScore,
        risk_level: riskLevel,
        services: services.rows,
        guardrails: guardrails.rows,
        alerts: alerts.rows,
        snapshots: snapshots.rows,
        recommendations: recommendations.rows,
        decisions: decisions.rows,
        budgets: budgets.rows,
        estimate: estimates.rows[0] || null,
        arch_review: archReviews.rows[0] || null,
      }
    })
  } catch (err) {
    console.error('[projects GET/:id]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── POST /api/projects ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const orgId = await getOrgId()
    const { name, type, description, budget_annual, status = 'active' } = req.body
    if (!name || !type) return res.status(400).json({ success: false, error: 'name and type are required' })

    const r = await pool.query(`
      INSERT INTO projects (org_id, name, type, status, description, budget_annual, arch_score, cost_score, risk_level)
      VALUES ($1,$2,$3,$4,$5,$6,85,'B','low')
      RETURNING *
    `, [orgId, name, type, status, description || null, budget_annual || null])

    if (budget_annual) {
      await pool.query(`
        INSERT INTO budgets (project_id, year, annual_target)
        VALUES ($1, $2, $3) ON CONFLICT (project_id, year) DO NOTHING
      `, [r.rows[0].id, new Date().getFullYear(), budget_annual])
    }

    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    console.error('[projects POST]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── PUT /api/projects/:id ─────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, budget_annual, status } = req.body

    const r = await pool.query(`
      UPDATE projects SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        budget_annual = COALESCE($3, budget_annual),
        status = COALESCE($4, status),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [name, description, budget_annual, status, id])

    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Project not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) {
    console.error('[projects PUT]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ── DELETE /api/projects/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query(`DELETE FROM projects WHERE id = $1`, [id])
    res.json({ success: true })
  } catch (err) {
    console.error('[projects DELETE]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
