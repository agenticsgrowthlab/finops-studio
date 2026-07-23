import { Router } from 'express'
import { pool } from '../server.js'

const router = Router()

// GET /api/services?project_id=xxx
router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query
    if (!project_id) return res.status(400).json({ success: false, error: 'project_id required' })
    const r = await pool.query(`SELECT * FROM services WHERE project_id = $1 ORDER BY created_at`, [project_id])
    res.json({ success: true, data: r.rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/services
router.post('/', async (req, res) => {
  try {
    const { project_id, name, model_id, calls_per_day, prompt_tokens_avg, completion_tokens_avg, caching_enabled, notes } = req.body
    if (!project_id || !name || !model_id) return res.status(400).json({ success: false, error: 'project_id, name and model_id required' })

    // Calculate cost from pricing table
    const pricing = await pool.query(`SELECT * FROM model_pricing WHERE model_id = $1 AND deprecated_at IS NULL LIMIT 1`, [model_id])
    let cost_month = 0
    if (pricing.rows[0]) {
      const p = pricing.rows[0]
      const monthlyIn  = (Number(calls_per_day) * 30 * Number(prompt_tokens_avg))     / 1_000_000 * Number(p.cost_per_1m_input)
      const monthlyOut = (Number(calls_per_day) * 30 * Number(completion_tokens_avg)) / 1_000_000 * Number(p.cost_per_1m_output)
      cost_month = Math.round((monthlyIn + monthlyOut) * 100) / 100
    }

    const r = await pool.query(`
      INSERT INTO services (project_id,name,model_id,calls_per_day,prompt_tokens_avg,completion_tokens_avg,cost_month,caching_enabled,notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [project_id, name, model_id, calls_per_day||0, prompt_tokens_avg||0, completion_tokens_avg||0, cost_month, caching_enabled||false, notes||null])

    await pool.query(`UPDATE projects SET updated_at=NOW() WHERE id=$1`, [project_id])
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PUT /api/services/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, model_id, calls_per_day, prompt_tokens_avg, completion_tokens_avg, caching_enabled, notes } = req.body

    // Recalculate cost if model or usage changed
    let cost_month = null
    if (model_id && calls_per_day && prompt_tokens_avg && completion_tokens_avg) {
      const pricing = await pool.query(`SELECT * FROM model_pricing WHERE model_id = $1 AND deprecated_at IS NULL LIMIT 1`, [model_id])
      if (pricing.rows[0]) {
        const p = pricing.rows[0]
        const monthlyIn  = (Number(calls_per_day) * 30 * Number(prompt_tokens_avg))     / 1_000_000 * Number(p.cost_per_1m_input)
        const monthlyOut = (Number(calls_per_day) * 30 * Number(completion_tokens_avg)) / 1_000_000 * Number(p.cost_per_1m_output)
        cost_month = Math.round((monthlyIn + monthlyOut) * 100) / 100
      }
    }

    const r = await pool.query(`
      UPDATE services SET
        name = COALESCE($1, name),
        model_id = COALESCE($2, model_id),
        calls_per_day = COALESCE($3, calls_per_day),
        prompt_tokens_avg = COALESCE($4, prompt_tokens_avg),
        completion_tokens_avg = COALESCE($5, completion_tokens_avg),
        cost_month = COALESCE($6, cost_month),
        caching_enabled = COALESCE($7, caching_enabled),
        notes = COALESCE($8, notes),
        updated_at = NOW()
      WHERE id = $9 RETURNING *
    `, [name, model_id, calls_per_day, prompt_tokens_avg, completion_tokens_avg, cost_month, caching_enabled, notes, id])

    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Service not found' })
    await pool.query(`UPDATE projects SET updated_at=NOW() WHERE id=$1`, [r.rows[0].project_id])
    res.json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/services/:id
router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query(`DELETE FROM services WHERE id=$1 RETURNING project_id`, [req.params.id])
    if (r.rows[0]) await pool.query(`UPDATE projects SET updated_at=NOW() WHERE id=$1`, [r.rows[0].project_id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router