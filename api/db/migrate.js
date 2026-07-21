// api/db/migrate.js
import 'dotenv/config'
import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Pool } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function migrate() {
  console.log('🔧 Running migrations...')
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8')
  try {
    await pool.query(sql)
    console.log('✅ Schema applied successfully')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()