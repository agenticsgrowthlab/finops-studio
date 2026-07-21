import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import pg from 'pg'

const { Pool } = pg
const app = express()
const PORT = process.env.PORT || 3001

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
})

const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:5174')
  .split(',').map(s => s.trim())

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost')) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type'],
}))

app.use(express.json())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }))

app.get('/api/health', async (req, res) => {
  let dbStatus = 'error'
  let orgName = null
  try {
    const r = await pool.query(`SELECT name FROM organizations LIMIT 1`)
    dbStatus = 'ok'
    orgName = r.rows[0]?.name || null
  } catch (e) { dbStatus = e.message }

  res.json({
    status: 'ok',
    service: 'AI FinOps Architecture Studio API',
    version: '2.0.0',
    db: dbStatus,
    org: orgName,
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
    timestamp: new Date().toISOString(),
  })
})

export async function getOrgId() {
  const r = await pool.query(`SELECT id FROM organizations WHERE name = 'Agentics Growth Lab' LIMIT 1`)
  if (!r.rows[0]) throw new Error('Organization not found — run seed first')
  return r.rows[0].id
}

import projectsRouter   from './routes/projects.js'
import servicesRouter   from './routes/services.js'
import guardrailsRouter from './routes/guardrails.js'
import decisionsRouter  from './routes/decisions.js'
import snapshotsRouter  from './routes/snapshots.js'
import pricingRouter    from './routes/pricing.js'
import chatRouter       from './routes/chat.js'

app.use('/api/projects',   projectsRouter)
app.use('/api/services',   servicesRouter)
app.use('/api/guardrails', guardrailsRouter)
app.use('/api/decisions',  decisionsRouter)
app.use('/api/snapshots',  snapshotsRouter)
app.use('/api/pricing',    pricingRouter)
app.use('/api/chat',       chatRouter)

app.use((req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, req, res, next) => {
  console.error('[API Error]', err.message)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`\n🚀 AI FinOps Architecture Studio API`)
  console.log(`   Port:    ${PORT}`)
  console.log(`   Health:  http://localhost:${PORT}/api/health`)
  console.log(`   DB:      ${process.env.DATABASE_URL ? 'connected' : 'NOT SET'}`)
  console.log(`   Claude:  ${process.env.ANTHROPIC_API_KEY ? 'configured' : 'NOT SET'}\n`)
})

export default app