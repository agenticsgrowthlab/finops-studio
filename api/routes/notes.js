import { Router } from 'express'
import { pool, getOrgId } from '../server.js'

const router = Router()

// GET /api/notes?project_id=xxx (or omit for org-level notes)
router.get('/', async (req, res) => {
  try {
    const orgId = await getOrgId()
    const { project_id } = req.query
    const r = await pool.query(
      `SELECT * FROM notes WHERE org_id = $1 AND project_id IS NOT DISTINCT FROM $2 ORDER BY created_at DESC`,
      [orgId, project_id || null]
    )
    res.json({ success: true, data: r.rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/notes
router.post('/', async (req, res) => {
  try {
    const orgId = await getOrgId()
    const { project_id, title, body } = req.body
    if (!body) return res.status(400).json({ success: false, error: 'body required' })
    const r = await pool.query(
      `INSERT INTO notes (org_id, project_id, title, body) VALUES ($1,$2,$3,$4) RETURNING *`,
      [orgId, project_id || null, title || null, body]
    )
    res.status(201).json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PUT /api/notes/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, body } = req.body
    const r = await pool.query(
      `UPDATE notes SET title=COALESCE($1,title), body=COALESCE($2,body), updated_at=NOW() WHERE id=$3 RETURNING *`,
      [title, body, req.params.id]
    )
    if (!r.rows[0]) return res.status(404).json({ success: false, error: 'Note not found' })
    res.json({ success: true, data: r.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/notes/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM notes WHERE id=$1`, [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
