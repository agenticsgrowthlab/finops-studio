// api/db/seed.js
import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function seed() {
  console.log('🌱 Seeding database...')
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Organization
    const orgResult = await client.query(`
      INSERT INTO organizations (name, plan)
      VALUES ('Agentics Growth Lab', 'enterprise')
      ON CONFLICT DO NOTHING
      RETURNING id
    `)
    let orgId
    if (orgResult.rows.length > 0) {
      orgId = orgResult.rows[0].id
    } else {
      const existing = await client.query(`SELECT id FROM organizations WHERE name = 'Agentics Growth Lab'`)
      orgId = existing.rows[0].id
    }
    console.log('✅ Organization:', orgId)

    // Model Pricing
    const models = [
      { model_id: 'claude-haiku-4-5', provider: 'Anthropic', display_name: 'Claude Haiku', cost_per_1m_input: 0.80, cost_per_1m_output: 4.00, strengths: ['Speed','Cost efficiency','High volume'], weaknesses: ['Complex reasoning'], best_for: 'Classification, routing, simple drafts' },
      { model_id: 'claude-sonnet-4-6', provider: 'Anthropic', display_name: 'Claude Sonnet', cost_per_1m_input: 4.50, cost_per_1m_output: 18.00, strengths: ['Balanced quality','Strong reasoning','Enterprise tasks'], weaknesses: ['Cost at high scale'], best_for: 'Meeting prep, email drafts, analysis' },
      { model_id: 'claude-opus-4-6', provider: 'Anthropic', display_name: 'Claude Opus', cost_per_1m_input: 15.00, cost_per_1m_output: 75.00, strengths: ['Highest quality','Complex reasoning'], weaknesses: ['Cost','Latency'], best_for: 'Architecture reviews, strategic analysis' },
      { model_id: 'gpt-4o', provider: 'OpenAI', display_name: 'GPT-4o', cost_per_1m_input: 5.00, cost_per_1m_output: 15.00, strengths: ['Vision','Multimodal','Speed'], weaknesses: ['Cost vs Sonnet for text'], best_for: 'Vision tasks, multimodal workflows' },
      { model_id: 'gpt-4o-mini', provider: 'OpenAI', display_name: 'GPT-4o Mini', cost_per_1m_input: 0.15, cost_per_1m_output: 0.60, strengths: ['Very low cost','Fast'], weaknesses: ['Quality ceiling'], best_for: 'High-volume simple classification' },
      { model_id: 'gemini-1.5-pro', provider: 'Google', display_name: 'Gemini 1.5 Pro', cost_per_1m_input: 3.50, cost_per_1m_output: 10.50, strengths: ['Long context','Multimodal'], weaknesses: ['Consistency'], best_for: 'Long document analysis' },
    ]
    for (const m of models) {
      await client.query(`
        INSERT INTO model_pricing (model_id, provider, display_name, cost_per_1m_input, cost_per_1m_output, strengths, weaknesses, best_for)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING
      `, [m.model_id, m.provider, m.display_name, m.cost_per_1m_input, m.cost_per_1m_output, JSON.stringify(m.strengths), JSON.stringify(m.weaknesses), m.best_for])
    }
    console.log('✅ Model pricing: 6 models')

    // Project 1: AdvisorOS
    const p1 = await client.query(`
      INSERT INTO projects (org_id, name, type, status, description, budget_annual, arch_score, cost_score, risk_level)
      VALUES ($1,'AdvisorOS','existing','active','Enterprise AI advisor workstation — email draft generation, meeting prep, client insights, and guided advisor workflows.',12000,82,'B','low')
      RETURNING id
    `, [orgId])
    const p1Id = p1.rows[0].id

    const p1Svcs = [
      { name: 'Email Draft Generation', model_id: 'claude-haiku-4-5', calls: 45, prompt: 800, completion: 400, cost: 42, caching: false },
      { name: 'Meeting Prep Briefing', model_id: 'claude-sonnet-4-6', calls: 12, prompt: 2400, completion: 1200, cost: 38, caching: true },
      { name: 'Daily Brief Ranking', model_id: 'claude-haiku-4-5', calls: 50, prompt: 600, completion: 200, cost: 18, caching: true },
    ]
    for (const s of p1Svcs) {
      await client.query(`INSERT INTO services (project_id,name,model_id,calls_per_day,prompt_tokens_avg,completion_tokens_avg,cost_month,caching_enabled) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [p1Id, s.name, s.model_id, s.calls, s.prompt, s.completion, s.cost, s.caching])
    }
    await client.query(`INSERT INTO budgets (project_id,year,annual_target) VALUES ($1,2026,12000)`, [p1Id])
    for (const sn of [{label:'Jul 14',spend:88},{label:'Jul 7',spend:82},{label:'Jun 30',spend:91},{label:'Jun 23',spend:79},{label:'Jun 16',spend:76}]) {
      await client.query(`INSERT INTO snapshots (project_id,spend,period_label) VALUES ($1,$2,$3)`, [p1Id, sn.spend, sn.label])
    }
    for (const g of [
      { type:'monthly_ceiling', label:'Monthly Spend Ceiling', threshold:150, operator:'lte', action:'alert', status:'active', current:98 },
      { type:'weekly_drift', label:'Week-over-Week Drift', threshold:15, operator:'lte', action:'alert', status:'active', current:7.3 },
      { type:'cost_per_interaction', label:'Cost Per Interaction', threshold:0.05, operator:'lte', action:'alert', status:'active', current:0.031 },
      { type:'approved_models', label:'Approved Models Only', threshold:null, operator:null, action:'block', status:'active', current:null },
      { type:'caching_required', label:'Caching Required', threshold:null, operator:null, action:'warn', status:'warning', current:null },
    ]) {
      await client.query(`INSERT INTO guardrails (project_id,type,label,threshold,operator,action,status,current_value) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [p1Id, g.type, g.label, g.threshold, g.operator, g.action, g.status, g.current])
    }
    await client.query(`INSERT INTO recommendations (project_id,category,title,body,priority,source) VALUES ($1,'cost','Enable caching on Email Draft Generation','System prompt and client context are largely static per advisor. Enabling prompt caching could reduce token costs by 30–40% on this service.','high','system')`, [p1Id])
    await client.query(`INSERT INTO decisions (project_id,title,rationale,model_chosen,alternatives_considered,quality_impact,cost_impact,risk_impact,owner,status,approval_date) VALUES ($1,'Use Haiku for email draft generation','Email generation quality is sufficient with Haiku at 1/5 the cost of Sonnet. Tested both — advisor feedback was equivalent.','claude-haiku-4-5','["claude-sonnet-4-6"]','neutral','-78%','low','Nicole Martinez','approved','2026-02-10')`, [p1Id])
    console.log('✅ Project AdvisorOS seeded')

    // Project 2: EOS
    const p2 = await client.query(`
      INSERT INTO projects (org_id,name,type,status,description,budget_annual,arch_score,cost_score,risk_level)
      VALUES ($1,'Enterprise Platform OS (EOS)','existing','active','Enterprise platform governance and executive reporting — Cloudflare Workers + KV.',3600,91,'A','low')
      RETURNING id
    `, [orgId])
    const p2Id = p2.rows[0].id

    await client.query(`INSERT INTO services (project_id,name,model_id,calls_per_day,prompt_tokens_avg,completion_tokens_avg,cost_month,caching_enabled) VALUES ($1,'Executive Report Generation','claude-sonnet-4-6',3,3200,1800,18,true)`, [p2Id])
    await client.query(`INSERT INTO budgets (project_id,year,annual_target) VALUES ($1,2026,3600)`, [p2Id])
    for (const sn of [{label:'Jul 14',spend:18},{label:'Jul 7',spend:17},{label:'Jun 30',spend:19},{label:'Jun 23',spend:16},{label:'Jun 16',spend:18}]) {
      await client.query(`INSERT INTO snapshots (project_id,spend,period_label) VALUES ($1,$2,$3)`, [p2Id, sn.spend, sn.label])
    }
    await client.query(`INSERT INTO guardrails (project_id,type,label,threshold,operator,action,status,current_value) VALUES ($1,'monthly_ceiling','Monthly Spend Ceiling',50,'lte','alert','active',18)`, [p2Id])
    await client.query(`INSERT INTO guardrails (project_id,type,label,threshold,operator,action,status,current_value) VALUES ($1,'weekly_drift','Week-over-Week Drift',20,'lte','alert','active',5.9)`, [p2Id])
    console.log('✅ Project EOS seeded')

    // Settings
    for (const [key, value] of [['ai_provider','anthropic'],['default_currency','USD'],['snapshot_cadence','weekly']]) {
      await client.query(`INSERT INTO settings (org_id,key,value) VALUES ($1,$2,$3) ON CONFLICT (org_id,key) DO NOTHING`, [orgId, key, value])
    }

    await client.query('COMMIT')
    console.log('🎉 Seed complete — Agentics Growth Lab is ready')

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Seed failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()