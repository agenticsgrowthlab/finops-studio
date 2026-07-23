import { Router } from 'express'
import { pool } from '../server.js'

const router = Router()

// GET /api/pricing — all active model pricing
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT * FROM model_pricing
      WHERE deprecated_at IS NULL
      ORDER BY provider, cost_per_1m_input
    `)
    res.json({ success: true, data: r.rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/pricing/:model_id
router.get('/:model_id', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT * FROM model_pricing
      WHERE model_id = $1 AND deprecated_at IS NULL
      LIMIT 1
    `, [req.params.model_id])
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Model not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/pricing/estimate — calculate spend estimate from inputs
// This is the deterministic cost calculator — Claude never does this math
router.post('/estimate', async (req, res) => {
  try {
    const { model_id, calls_per_day, prompt_tokens, completion_tokens } = req.body
    if (!model_id || !calls_per_day || !prompt_tokens || !completion_tokens) {
      return res.status(400).json({ success: false, error: 'model_id, calls_per_day, prompt_tokens, completion_tokens required' })
    }

    const pricing = await pool.query(`
      SELECT * FROM model_pricing WHERE model_id = $1 AND deprecated_at IS NULL LIMIT 1
    `, [model_id])

    if (!pricing.rows[0]) return res.status(404).json({ success: false, error: 'Model pricing not found' })

    const p = pricing.rows[0]
    const monthlyIn  = (Number(calls_per_day) * 30 * Number(prompt_tokens))     / 1_000_000 * Number(p.cost_per_1m_input)
    const monthlyOut = (Number(calls_per_day) * 30 * Number(completion_tokens)) / 1_000_000 * Number(p.cost_per_1m_output)
    const expected   = monthlyIn + monthlyOut

    res.json({
      success: true,
      data: {
        model_id,
        model_name: p.display_name,
        provider: p.provider,
        cost_per_1m_input: Number(p.cost_per_1m_input),
        cost_per_1m_output: Number(p.cost_per_1m_output),
        calls_per_day: Number(calls_per_day),
        prompt_tokens: Number(prompt_tokens),
        completion_tokens: Number(completion_tokens),
        cost_low_month:    Math.round(expected * 0.6  * 100) / 100,
        cost_exp_month:    Math.round(expected         * 100) / 100,
        cost_high_month:   Math.round(expected * 1.8  * 100) / 100,
        cost_low_annual:   Math.round(expected * 0.6  * 12 * 100) / 100,
        cost_exp_annual:   Math.round(expected         * 12 * 100) / 100,
        cost_high_annual:  Math.round(expected * 1.8  * 12 * 100) / 100,
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router