import { Router } from 'express'
import { pool } from '../server.js'

const router = Router()

// GET /api/guardrails?project_id=xxx
router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query
    if (!project_id) return res.status(400).json({ success: false, error: 'project_id required' })
    const r = await pool.query(`SELECT * FROM guardrails WHERE project_id = $1 ORDER BY created_at`, [project_id])
    res.json({ success: true, data: r.rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/guardrails
router.post('/', async (req, res) => {
  try {
    const { project_id, type, label, threshold, operator, action, config } = req.body
    if (!project_id || !type || !label) return res.status(400).json({ success: false, error: 'project_id, type and label required' })
    const r = await pool.query(`
      INSERT INTO guardrails (project_id, type, label, threshold, operator, action, config)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [project_id, type, label, threshold||null, operator||null, action||'alert', JSON.stringify(config||{})])
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PUT /api/guardrails/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { label, threshold, operator, action, status, current_value, config } = req.body
    const r = await pool.query(`
      UPDATE guardrails SET
        label = COALESCE($1, label),
        threshold = COALESCE($2, threshold),
        operator = COALESCE($3, operator),
        action = COALESCE($4, action),
        status = COALESCE($5, status),
        current_value = COALESCE($6, current_value),
        config = COALESCE($7, config),
        updated_at = NOW()
      WHERE id = $8 RETURNING *
    `, [label, threshold, operator, action, status, current_value, config ? JSON.stringify(config) : null, id])
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Guardrail not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/guardrails/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM guardrails WHERE id = $1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router