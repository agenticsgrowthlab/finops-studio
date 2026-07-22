import React, { useState } from 'react'
import { formatCost, monthlySpend } from '../data/demo.js'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// CO2 estimate: ~0.0003 kg CO2 per 1000 tokens (data center average)
function estimateCO2(totalMonthlyTokens) {
  return (totalMonthlyTokens / 1000) * 0.0003
}

// Model price drift estimates based on historical patterns
// Models have generally decreased in price 20-40% per year
const MODEL_DRIFT = {
  'claude-haiku-4-5':  -0.20, // -20% per year (already cheap, less room)
  'claude-sonnet-4-6': -0.25, // -25% per year
  'claude-opus-4-6':   -0.30, // -30% per year
  'gpt-4o':            -0.25,
  'gpt-4o-mini':       -0.20,
  'gemini-1.5-pro':    -0.25,
}

function getModelDrift(modelId) {
  return MODEL_DRIFT[modelId] || -0.20
}

function buildForecast(projects, adoptionGrowthPct, months) {
  const monthlyRate = adoptionGrowthPct / 100 / 12

  return Array.from({ length: months }, (_, i) => {
    const month = i + 1
    const label = new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000)
      .toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

    let totalSpend = 0
    let totalTokens = 0

    projects.forEach(p => {
      (p.services || []).forEach(svc => {
        const base = Number(svc.cost_month || 0)
        const adoptionMultiplier = Math.pow(1 + monthlyRate, month)
        const annualDrift = getModelDrift(svc.model_id)
        const monthlyDrift = annualDrift / 12
        const driftMultiplier = Math.pow(1 + monthlyDrift, month)
        totalSpend += base * adoptionMultiplier * driftMultiplier

        // Tokens for CO2
        const monthlyTokens = (Number(svc.calls_per_day || 0) * 30 *
          (Number(svc.prompt_tokens_avg || 0) + Number(svc.completion_tokens_avg || 0)))
        totalTokens += monthlyTokens * adoptionMultiplier
      })
    })

    return { month, label, spend: totalSpend, tokens: totalTokens, co2: estimateCO2(totalTokens) }
  })
}

export default function Forecasting({ projects }) {
  const [view, setView] = useState('monthly')
  const [adoptionGrowth, setAdoptionGrowth] = useState(20)
  const [showCO2, setShowCO2] = useState(false)

  const totalMonthly = projects.reduce((s, p) => s + monthlySpend(p), 0)

  const weeklyData  = buildForecast(projects, adoptionGrowth, 8).map((d, i) => ({ ...d, label: `Wk ${i+1}`, spend: d.spend / 4.3 }))
  const monthlyData = buildForecast(projects, adoptionGrowth, 12)
  const annualData  = buildForecast(projects, adoptionGrowth, 36).filter((_, i) => (i + 1) % 12 === 0).map((d, i) => ({ ...d, label: `Year ${i+1}` }))

  const data = view === 'weekly' ? weeklyData : view === 'monthly' ? monthlyData : annualData
  const maxSpend = Math.max(...data.map(d => d.spend))
  const totalForecast = data[data.length - 1]?.spend || 0
  const totalBudget = projects.reduce((s, p) => s + Number(p.budget_annual || 0), 0)

  // Model drift explanation
  const modelDriftSummary = [...new Set(projects.flatMap(p => (p.services||[]).map(s => s.model_id)))]
    .filter(Boolean)
    .map(mid => {
      const drift = getModelDrift(mid)
      const name = mid.replace('claude-', 'Claude ').replace(/-/g, ' ')
      return `${name}: ${(drift * 100).toFixed(0)}%/yr`
    })

  return (
    <div className="page fade-in">
      <div className="page-sub" style={{ marginBottom: 24 }}>AI spend forecast across all projects — adoption growth + model price drift</div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Forecast Inputs</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          <div>
            <label className="form-label">Anticipated Adoption Growth (annual %)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range" min={0} max={200} step={5} value={adoptionGrowth}
                onChange={e => setAdoptionGrowth(Number(e.target.value))}
                className="form-input" style={{ padding: 0, height: 6, cursor: 'pointer' }}
              />
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 18, color: 'var(--gold)', fontWeight: 700, minWidth: 60 }}>
                {adoptionGrowth}%
              </span>
            </div>
            <div className="form-hint">How fast will usage grow year-over-year</div>
          </div>

          <div>
            <label className="form-label">Model Price Drift (AI estimated)</label>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7, marginTop: 6 }}>
              {modelDriftSummary.length > 0 ? modelDriftSummary.join(' · ') : 'No services yet'}
            </div>
            <div className="form-hint">Based on historical LLM price trends — same model, not upgrades</div>
          </div>

          <div>
            <label className="form-label">Display</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {['weekly','monthly','annual'].map(v => (
                <button key={v} onClick={() => setView(v)} className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>{v}</button>
              ))}
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={showCO2} onChange={e => setShowCO2(e.target.checked)} id="co2toggle" />
              <label htmlFor="co2toggle" style={{ fontSize: 12.5, color: 'var(--muted)', cursor: 'pointer' }}>Show CO₂ estimate</label>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="stat-grid stat-grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Current Monthly</div>
          <div className="stat-value">{formatCost(totalMonthly)}</div>
          <div className="stat-sub">Baseline today</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{view === 'weekly' ? 'Week 8' : view === 'monthly' ? 'Month 12' : 'Year 3'} Forecast</div>
          <div className="stat-value" style={{ color: totalForecast > totalMonthly * 2 ? 'var(--red)' : totalForecast > totalMonthly * 1.5 ? 'var(--amber)' : 'var(--gold)' }}>
            {formatCost(totalForecast)}
          </div>
          <div className="stat-sub">At {adoptionGrowth}% adoption growth</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Growth Multiplier</div>
          <div className="stat-value" style={{ fontSize: 28, color: 'var(--steel)' }}>
            {totalMonthly > 0 ? (totalForecast / (totalMonthly || 1)).toFixed(1) : '—'}×
          </div>
          <div className="stat-sub">vs current spend</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Annual Budget</div>
          <div className="stat-value" style={{ fontSize: 24, color: totalForecast * 12 > totalBudget ? 'var(--red)' : 'var(--green)' }}>
            {totalBudget > 0 ? `${((totalForecast * 12 / totalBudget) * 100).toFixed(0)}%` : '—'}
          </div>
          <div className="stat-sub">of budget at peak</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 20 }}>
          {view === 'weekly' ? '8-Week' : view === 'monthly' ? '12-Month' : '3-Year'} Spend Forecast
          {adoptionGrowth > 0 && <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>· {adoptionGrowth}% adoption growth + model price drift</span>}
        </div>

        {/* Bar chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: view === 'weekly' ? 16 : view === 'monthly' ? 8 : 24, height: 180, marginBottom: 8, paddingBottom: 4 }}>
          {data.map((d, i) => {
            const h = maxSpend > 0 ? (d.spend / maxSpend) * 160 : 0
            const isPast = i === 0
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 8.5, color: 'var(--muted)', textAlign: 'center' }}>{formatCost(d.spend)}</div>
                <div style={{ width: '100%', height: h, background: isPast ? 'var(--steel)' : `rgba(212,185,106,${0.4 + (i/data.length)*0.6})`, borderRadius: '3px 3px 0 0', transition: 'height 0.3s' }} />
                {showCO2 && (
                  <div style={{ fontSize: 7.5, color: 'var(--green)', textAlign: 'center' }}>{d.co2.toFixed(2)}kg</div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: view === 'weekly' ? 16 : view === 'monthly' ? 8 : 24 }}>
          {data.map((d, i) => (
            <div key={i} style={{ flex: 1, fontSize: 8.5, color: 'var(--muted)', textAlign: 'center' }}>{d.label}</div>
          ))}
        </div>
      </div>

      {/* Model drift explanation */}
      <div className="card">
        <div className="card-title">How This Forecast Is Calculated</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Adoption Growth Component</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7 }}>
              Your {adoptionGrowth}% annual growth assumption is applied monthly ({(adoptionGrowth/12).toFixed(1)}%/mo) to current service usage — compounded. This reflects more users, more calls, or broader feature adoption.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Model Price Drift Component</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7 }}>
              AI model prices have historically declined 20–30% per year as providers scale. This forecast applies those trends to your specific models — same model, not upgrades. Drift works in your favor: it partially offsets adoption growth cost.
            </div>
          </div>
        </div>
        {showCO2 && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(14,122,92,0.08)', border: '1px solid rgba(14,122,92,0.2)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>CO₂ Methodology</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Estimated at ~0.0003 kg CO₂ per 1,000 tokens processed, based on average data center energy consumption. This is an approximation — actual emissions vary by provider infrastructure and energy mix.</div>
          </div>
        )}
      </div>
    </div>
  )
}
