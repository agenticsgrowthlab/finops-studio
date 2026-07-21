import { Router } from 'express'
import { pool } from '../server.js'

const router = Router()

// GET /api/decisions?project_id=xxx
router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query
    if (!project_id) return res.status(400).json({ success: false, error: 'project_id required' })
    const r = await pool.query(`SELECT * FROM decisions WHERE project_id = $1 ORDER BY created_at DESC`, [project_id])
    res.json({ success: true, data: r.rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/decisions
router.post('/', async (req, res) => {
  try {
    const { project_id, title, rationale, model_chosen, alternatives_considered, quality_impact, cost_impact, risk_impact, owner, status, approval_date, linked_guardrails } = req.body
    if (!project_id || !title) return res.status(400).json({ success: false, error: 'project_id and title required' })
    const r = await pool.query(`
      INSERT INTO decisions (project_id,title,rationale,model_chosen,alternatives_considered,quality_impact,cost_impact,risk_impact,owner,status,approval_date,linked_guardrails)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
    `, [
      project_id, title, rationale||null, model_chosen||null,
      JSON.stringify(alternatives_considered||[]),
      quality_impact||null, cost_impact||null, risk_impact||null,
      owner||null, status||'pending', approval_date||null,
      JSON.stringify(linked_guardrails||[])
    ])
    await pool.query(`UPDATE projects SET updated_at=NOW() WHERE id=$1`, [project_id])
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PUT /api/decisions/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, rationale, model_chosen, alternatives_considered, quality_impact, cost_impact, risk_impact, owner, status, approval_date, linked_guardrails } = req.body
    const r = await pool.query(`
      UPDATE decisions SET
        title = COALESCE($1, title),
        rationale = COALESCE($2, rationale),
        model_chosen = COALESCE($3, model_chosen),
        alternatives_considered = COALESCE($4, alternatives_considered),
        quality_impact = COALESCE($5, quality_impact),
        cost_impact = COALESCE($6, cost_impact),
        risk_impact = COALESCE($7, risk_impact),
        owner = COALESCE($8, owner),
        status = COALESCE($9, status),
        approval_date = COALESCE($10, approval_date),
        linked_guardrails = COALESCE($11, linked_guardrails),
        updated_at = NOW()
      WHERE id = $12 RETURNING *
    `, [
      title, rationale, model_chosen,
      alternatives_considered ? JSON.stringify(alternatives_considered) : null,
      quality_impact, cost_impact, risk_impact,
      owner, status, approval_date,
      linked_guardrails ? JSON.stringify(linked_guardrails) : null,
      id
    ])
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Decision not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/decisions/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM decisions WHERE id = $1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router