// api/routes/reviews.js
import { Router } from 'express'
import { pool } from '../server.js'

const router = Router()

// GET /api/projects/:id/arch-review
router.get('/:id/arch-review', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM architecture_reviews WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    )
    res.json({ success: true, data: r.rows[0] || null })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/projects/:id/arch-review
router.post('/:id/arch-review', async (req, res) => {
  try {
    const { id } = req.params
    const { interview_answers, recommended_arch, retrieval_strategy, knowledge_strategy, model_choices, assumptions, risks, guardrails_triggered, approval_status, approval_recommendation, claude_summary } = req.body

    // Upsert — one review per project (replace if exists)
    await pool.query(`DELETE FROM architecture_reviews WHERE project_id = $1`, [id])

    const r = await pool.query(`
      INSERT INTO architecture_reviews (project_id, interview_answers, recommended_arch, retrieval_strategy, knowledge_strategy, model_choices, assumptions, risks, guardrails_triggered, approval_status, approval_recommendation, claude_summary)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `, [
      id,
      JSON.stringify(interview_answers || {}),
      recommended_arch || null,
      retrieval_strategy || null,
      knowledge_strategy || null,
      JSON.stringify(model_choices || []),
      JSON.stringify(assumptions || []),
      JSON.stringify(risks || []),
      JSON.stringify(guardrails_triggered || []),
      approval_status || 'draft',
      approval_recommendation || null,
      claude_summary || null,
    ])

    await pool.query(`UPDATE projects SET updated_at=NOW() WHERE id=$1`, [id])
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
