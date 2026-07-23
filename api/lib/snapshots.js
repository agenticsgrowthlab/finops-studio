import { Router } from 'express'
import { pool } from '../server.js'

const router = Router()

// GET /api/snapshots?project_id=xxx
router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query
    if (!project_id) return res.status(400).json({ success: false, error: 'project_id required' })
    const r = await pool.query(
      `SELECT * FROM snapshots WHERE project_id = $1 ORDER BY captured_at DESC LIMIT 12`,
      [project_id]
    )
    res.json({ success: true, data: r.rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/snapshots — capture current spend for a project
router.post('/', async (req, res) => {
  try {
    const { project_id, period_label } = req.body
    if (!project_id) return res.status(400).json({ success: false, error: 'project_id required' })

    // Calculate current total spend from services
    const services = await pool.query(
      `SELECT * FROM services WHERE project_id = $1`, [project_id]
    )
    const totalSpend = services.rows.reduce((s, svc) => s + Number(svc.cost_month || 0), 0)

    const label = period_label || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    const r = await pool.query(`
      INSERT INTO snapshots (project_id, spend, period_label)
      VALUES ($1, $2, $3) RETURNING *
    `, [project_id, totalSpend, label])

    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/snapshots/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM snapshots WHERE id = $1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router