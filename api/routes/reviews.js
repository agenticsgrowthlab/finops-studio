import { Router } from 'express'
import { pool } from '../server.js'

const router = Router()

// GET /api/reviews/:projectId
router.get('/:projectId', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM architecture_reviews WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.projectId]
    )
    res.json({ success: true, data: r.rows[0] || null })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/reviews/:projectId
router.post('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params
    const { interview_answers, recommended_arch, retrieval_strategy, model_choices, assumptions, approval_status, claude_summary } = req.body

    await pool.query(`DELETE FROM architecture_reviews WHERE project_id = $1`, [projectId])

    const r = await pool.query(`
      INSERT INTO architecture_reviews (project_id, interview_answers, recommended_arch, retrieval_strategy, model_choices, assumptions, risks, guardrails_triggered, approval_status, claude_summary)
      VALUES ($1,$2,$3,$4,$5,$6,'[]','[]',$7,$8) RETURNING *
    `, [
      projectId,
      JSON.stringify(interview_answers || {}),
      recommended_arch || null,
      retrieval_strategy || null,
      JSON.stringify(model_choices || []),
      JSON.stringify(assumptions || []),
      approval_status || 'draft',
      claude_summary || null,
    ])

    await pool.query(`UPDATE projects SET updated_at=NOW() WHERE id=$1`, [projectId])
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    console.error('[reviews POST]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
