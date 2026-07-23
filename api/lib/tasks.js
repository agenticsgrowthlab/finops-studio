import { Router } from 'express'
import { pool, getOrgId } from '../server.js'

const router = Router()

// Default 30-60-90 tasks seeded for new orgs
const DEFAULT_TASKS = [
  // Phase 1 — 30 days
  { phase: 1, quarter: null, task: 'Create a project for every AI platform in scope', sort_order: 1 },
  { phase: 1, quarter: null, task: 'Add services with model, daily calls, and token usage for each platform', sort_order: 2 },
  { phase: 1, quarter: null, task: 'Set guardrails: monthly ceiling, weekly drift, cost per interaction', sort_order: 3 },
  { phase: 1, quarter: null, task: 'Run Architecture Review on each platform — document current state and risks', sort_order: 4 },
  { phase: 1, quarter: null, task: 'Take first weekly spend snapshot — establish drift detection baseline', sort_order: 5 },
  { phase: 1, quarter: null, task: 'Export first Leadership Report and present to Finance', sort_order: 6 },
  { phase: 1, quarter: null, task: 'Identify all AI platform owners and document in project decisions', sort_order: 7 },
  { phase: 1, quarter: null, task: 'Define cost allocation taxonomy: team, business unit, model, workflow', sort_order: 8 },
  // Phase 2 — 60 days
  { phase: 2, quarter: null, task: 'Run Scenario Planning: model 2×, 5×, 10× growth for every project', sort_order: 1 },
  { phase: 2, quarter: null, task: 'Implement model routing policy — gate access to high-cost models', sort_order: 2 },
  { phase: 2, quarter: null, task: 'Enable prompt caching on all eligible services', sort_order: 3 },
  { phase: 2, quarter: null, task: 'Build unit economics: cost per developer, per workflow, per interaction', sort_order: 4 },
  { phase: 2, quarter: null, task: 'Establish idle seat reclamation process — weekly audit', sort_order: 5 },
  { phase: 2, quarter: null, task: 'Add Model Change Approval guardrail to all projects', sort_order: 6 },
  { phase: 2, quarter: null, task: 'Define commitment strategy for high-volume platforms', sort_order: 7 },
  // Phase 3 — 90 days
  { phase: 3, quarter: null, task: 'Monthly AI spend close lands on time with variance explanations', sort_order: 1 },
  { phase: 3, quarter: null, task: 'Showback and chargeback live — spend attributable to team and BU', sort_order: 2 },
  { phase: 3, quarter: null, task: 'Forecasting tied to product-rollout milestones', sort_order: 3 },
  { phase: 3, quarter: null, task: 'Architecture Review is standard process for all new AI initiatives', sort_order: 4 },
  { phase: 3, quarter: null, task: 'FinOps Chatty answers leadership questions on demand, same day', sort_order: 5 },
  { phase: 3, quarter: null, task: 'Document model routing policy impact vs uncontrolled baseline', sort_order: 6 },
  { phase: 3, quarter: null, task: 'Present 90-day AI FinOps summary to executive leadership', sort_order: 7 },
]

// GET /api/tasks — get all tasks, seed defaults if empty
router.get('/', async (req, res) => {
  try {
    const orgId = await getOrgId()
    let r = await pool.query(
      `SELECT * FROM onboarding_tasks WHERE org_id=$1 ORDER BY phase NULLS LAST, quarter NULLS LAST, sort_order, created_at`,
      [orgId]
    )
    // Seed defaults if no tasks exist
    if (r.rows.length === 0) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        for (const t of DEFAULT_TASKS) {
          await client.query(
            `INSERT INTO onboarding_tasks (org_id, phase, quarter, task, sort_order) VALUES ($1,$2,$3,$4,$5)`,
            [orgId, t.phase, t.quarter, t.task, t.sort_order]
          )
        }
        await client.query('COMMIT')
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      } finally {
        client.release()
      }
      r = await pool.query(
        `SELECT * FROM onboarding_tasks WHERE org_id=$1 ORDER BY phase NULLS LAST, quarter NULLS LAST, sort_order, created_at`,
        [orgId]
      )
    }
    res.json({ success: true, data: r.rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/tasks — add custom task
router.post('/', async (req, res) => {
  try {
    const orgId = await getOrgId()
    const { phase, quarter, task, sort_order } = req.body
    if (!task) return res.status(400).json({ success: false, error: 'task required' })
    const r = await pool.query(
      `INSERT INTO onboarding_tasks (org_id, phase, quarter, task, sort_order, is_custom) VALUES ($1,$2,$3,$4,$5,true) RETURNING *`,
      [orgId, phase || null, quarter || null, task, sort_order || 99]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/tasks/assign-dates — bulk assign due dates from start date
router.post('/assign-dates', async (req, res) => {
  try {
    const orgId = await getOrgId()
    const { start_date } = req.body
    if (!start_date) return res.status(400).json({ success: false, error: 'start_date required' })

    const start = new Date(start_date)
    
    // Get all phase tasks ordered by phase and sort_order
    const r = await pool.query(
      `SELECT * FROM onboarding_tasks WHERE org_id=$1 AND phase IS NOT NULL ORDER BY phase, sort_order`,
      [orgId]
    )
    const tasks = r.rows

    // Phase date ranges
    const phaseEnd = { 1: 30, 2: 60, 3: 90 }
    const phaseStart = { 1: 0, 2: 30, 3: 60 }

    // Assign dates — spread across phase, business days preferred
    const updates = []
    const phaseGroups = { 1: [], 2: [], 3: [] }
    tasks.forEach(t => { if (t.phase) phaseGroups[t.phase].push(t) })

    for (const [phase, phaseTasks] of Object.entries(phaseGroups)) {
      const start_day = phaseStart[phase]
      const end_day = phaseEnd[phase]
      const span = end_day - start_day
      
      phaseTasks.forEach((t, i) => {
        // Spread evenly, first task gets day 1 of phase
        const dayOffset = start_day + Math.round((i / Math.max(phaseTasks.length - 1, 1)) * (span - 1))
        const due = new Date(start)
        due.setDate(due.getDate() + dayOffset)
        // Skip weekends
        if (due.getDay() === 0) due.setDate(due.getDate() + 1)
        if (due.getDay() === 6) due.setDate(due.getDate() + 2)
        updates.push({ id: t.id, due_date: due.toISOString().slice(0, 10) })
      })
    }

    // Bulk update
    for (const u of updates) {
      await pool.query(`UPDATE onboarding_tasks SET due_date=$1, updated_at=NOW() WHERE id=$2`, [u.due_date, u.id])
    }

    // Save start date to org
    await pool.query(`UPDATE organizations SET onboarding_start_date=$1 WHERE name='Agentics Growth Lab'`, [start_date])

    // Return all tasks with new dates
    const final = await pool.query(
      `SELECT * FROM onboarding_tasks WHERE org_id=$1 ORDER BY phase NULLS LAST, due_date NULLS LAST, sort_order`,
      [orgId]
    )
    res.json({ success: true, data: final.rows })
  } catch (err) {
    console.error('[tasks assign-dates]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})


// PATCH /api/tasks/:id — toggle complete, update notes, due_date
router.patch('/:id', async (req, res) => {
  try {
    const { completed, notes, task, due_date } = req.body
    const r = await pool.query(
      `UPDATE onboarding_tasks SET
        completed = COALESCE($1, completed),
        completed_at = CASE WHEN $1 = true THEN CURRENT_DATE WHEN $1 = false THEN NULL ELSE completed_at END,
        notes = COALESCE($2, notes),
        task = COALESCE($3, task),
        due_date = COALESCE($4, due_date),
        updated_at = NOW()
      WHERE id=$5 RETURNING *`,
      [completed ?? null, notes ?? null, task ?? null, due_date ?? null, req.params.id]
    )
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Task not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})


// DELETE /api/tasks/:id — only custom tasks
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM onboarding_tasks WHERE id=$1 AND is_custom=true`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
