import React, { useState } from 'react'
import { MODELS } from '../data/demo.js'

const ARCH_QUESTIONS = [
  { id: 'purpose', label: 'What is the primary purpose of this AI application?', placeholder: 'e.g. Generate personalized client communications based on CRM data' },
  { id: 'users', label: 'Who are the users and how many concurrent users do you expect?', placeholder: 'e.g. 50 financial advisors, peak 20 concurrent' },
  { id: 'frequency', label: 'How frequently will AI be invoked? (per user per day)', placeholder: 'e.g. 5–10 times per advisor per day' },
  { id: 'context', label: 'What context will be provided to the AI? (data sources, document types)', placeholder: 'e.g. CRM client record, calendar events, email history' },
  { id: 'output', label: 'What does the AI output? (document, decision, classification, draft)', placeholder: 'e.g. 200–400 word personalized email draft' },
  { id: 'quality', label: 'How sensitive is quality? (high / medium / low)', placeholder: 'e.g. High — advisors review before sending to clients' },
  { id: 'latency', label: 'What is the acceptable latency? (real-time / seconds / batch)', placeholder: 'e.g. 3–5 seconds acceptable, not real-time' },
  { id: 'compliance', label: 'Are there compliance or data privacy requirements?', placeholder: 'e.g. FINRA regulated, no PII to external models without consent' },
]

function estimateSpend(answers) {
  const freq = parseInt(answers.frequency) || 10
  const users = parseInt(answers.users) || 20
  const quality = (answers.quality || '').toLowerCase()

  let model = 'claude-haiku-4-5'
  let promptTokens = 800
  let completionTokens = 400
  let callsDay = freq * users

  if (quality.includes('high')) { model = 'claude-sonnet-4-6'; promptTokens = 2000; completionTokens = 800 }
  if (answers.context && answers.context.length > 100) { promptTokens *= 2 }
  if (answers.output && answers.output.toLowerCase().includes('document')) { completionTokens *= 2 }

  const m = MODELS.find(x => x.id === model)
  const monthlyIn = (callsDay * 30 * promptTokens) / 1_000_000 * m.costPer1MIn
  const monthlyOut = (callsDay * 30 * completionTokens) / 1_000_000 * m.costPer1MOut
  const expected = monthlyIn + monthlyOut

  return {
    model,
    callsDay,
    promptTokens,
    completionTokens,
    low: expected * 0.6,
    expected,
    high: expected * 1.8,
    annualLow: expected * 0.6 * 12,
    annualExpected: expected * 12,
    annualHigh: expected * 1.8 * 12,
    retrievalStrategy: promptTokens > 2000 ? 'Use RAG / retrieval to reduce context size before LLM call' : 'Direct prompting acceptable at this context size',
    cachingRecommended: callsDay > 20,
  }
}

export default function NewProject({ addProject, setPage, setActiveProjectId }) {
  const [step, setStep] = useState(1)
  const [type, setType] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [team, setTeam] = useState('')
  const [answers, setAnswers] = useState({})
  const [estimate, setEstimate] = useState(null)

  function handleTypeSelect(t) {
    setType(t)
    setStep(2)
  }

  function handleArchSubmit() {
    const est = estimateSpend(answers)
    setEstimate(est)
    setStep(4)
  }

  async function handleCreate() {
    try {
      await addProject({
        name,
        description,
        type,
        status: 'active',
        team: team || null,
        budget_annual: Number(budget) || (estimate ? Math.round(estimate.annualExpected * 1.2) : 0),
      })
      // addProject handles setActiveProjectId internally after reload
      setPage('project-detail')
    } catch (err) {
      alert('Error creating project: ' + err.message)
    }
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-sub">Create a project to track AI spend and prevent cost surprises</div>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {[1,2,3,4,5].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= s ? 'var(--gold)' : 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>

      {/* Step 1: Type */}
      {step === 1 && (
        <div className="fade-in">
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>What type of project?</div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 28 }}>Choose based on whether the AI application already exists or is being designed.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 600 }}>
            <div className="project-card" onClick={() => handleTypeSelect('existing')} style={{ cursor: 'pointer' }}>
              <i className="ti ti-chart-bar" style={{ fontSize: 32, color: 'var(--steel)', marginBottom: 12, display: 'block' }} />
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Existing Project</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>Track current AI spend, set guardrails, and prevent unexpected increases on a running application.</div>
            </div>
            <div className="project-card" onClick={() => handleTypeSelect('new')} style={{ cursor: 'pointer', borderColor: 'rgba(212,185,106,0.25)' }}>
              <i className="ti ti-sparkles" style={{ fontSize: 32, color: 'var(--gold)', marginBottom: 12, display: 'block' }} />
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>New Project</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>Design a new AI application from scratch. Get spend estimates, model recommendations, and a full architecture review.</div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Basic info */}
      {step === 2 && (
        <div className="fade-in" style={{ maxWidth: 560 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Project basics</div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 28 }}>Give this project a name and description so you can track it clearly.</div>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input className="form-input" placeholder="e.g. AdvisorOS Email Drafting" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="What does this AI application do?" value={description} onChange={e => setDescription(e.target.value)} style={{ minHeight: 80 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Annual AI Budget (USD, optional)</label>
            <input className="form-input" type="number" placeholder="12000" value={budget} onChange={e => setBudget(e.target.value)} />
            <div className="form-hint">We'll alert you when projected spend approaches this threshold.</div>
          </div>
          <div className="form-group">
            <label className="form-label">Enterprise Team (optional)</label>
            <input className="form-input" placeholder="e.g. Advisor Technology, Digital Banking, Platform Engineering" value={team} onChange={e => setTeam(e.target.value)} />
            <div className="form-hint">Used for cost allocation and chargeback reporting</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep(type === 'new' ? 3 : 5)} disabled={!name}>
              {type === 'new' ? 'Continue to Architecture Questions →' : 'Create Project →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Architecture questions (new projects only) */}
      {step === 3 && (
        <div className="fade-in" style={{ maxWidth: 640 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Architecture questions</div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 28 }}>Answer these questions to generate a spend estimate, model recommendations, and architecture review.</div>
          {ARCH_QUESTIONS.map(q => (
            <div className="form-group" key={q.id}>
              <label className="form-label">{q.label}</label>
              <input className="form-input" placeholder={q.placeholder} value={answers[q.id] || ''} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-primary" onClick={handleArchSubmit}>Generate Architecture Review →</button>
          </div>
        </div>
      )}

      {/* Step 4: Architecture review + estimate */}
      {step === 4 && estimate && (
        <div className="fade-in">
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Architecture Review</div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 28 }}>Based on your inputs. Review and adjust before finalizing.</div>

          {/* Cost estimates */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">Cost Estimate Range · Monthly</div>
            <div className="estimate-range">
              <div className="estimate-col low">
                <div className="estimate-col-label">Low</div>
                <div className="estimate-col-value">${estimate.low.toFixed(0)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Optimistic — caching, efficient prompts</div>
              </div>
              <div className="estimate-col expected">
                <div className="estimate-col-label">Expected</div>
                <div className="estimate-col-value">${estimate.expected.toFixed(0)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Based on your inputs</div>
              </div>
              <div className="estimate-col high">
                <div className="estimate-col-label">High</div>
                <div className="estimate-col-value">${estimate.high.toFixed(0)}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Growth, inefficiency, no caching</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
              <div><div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase' }}>Annual (expected)</div><div style={{ fontFamily: 'JetBrains Mono', fontSize: 18, color: 'var(--gold)', fontWeight: 700 }}>${Math.round(estimate.annualExpected).toLocaleString()}</div></div>
              <div><div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase' }}>Calls/Day</div><div style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 700 }}>{estimate.callsDay}</div></div>
              <div><div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase' }}>Recommended Model</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', marginTop: 2 }}>{estimate.model.replace('claude-', 'Claude ').replace(/-/g, ' ')}</div></div>
            </div>
          </div>

          {/* Model recommendations */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">Model Recommendations · Tradeoffs</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {MODELS.slice(0, 3).map(m => (
                <div key={m.id} className={`model-card ${m.id === estimate.model ? 'recommended' : ''}`}>
                  {m.id === estimate.model && <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>★ Recommended</div>}
                  <div className="model-name">{m.name}</div>
                  <div className="model-cost">${m.costPer1MIn}/M in · ${m.costPer1MOut}/M out</div>
                  <div style={{ marginBottom: 8 }}>
                    {m.strengths.map(s => <span key={s} className="model-tag tag-strength">{s}</span>)}
                    {m.weaknesses.map(w => <span key={w} className="model-tag tag-weakness">{w}</span>)}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>{m.bestFor}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture guidance */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">Architecture Guidance</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="rec-card">
                <i className="ti ti-database rec-icon" style={{ color: 'var(--steel)' }} />
                <div>
                  <div className="rec-title">Retrieval Strategy</div>
                  <div className="rec-body">{estimate.retrievalStrategy}</div>
                </div>
              </div>
              {estimate.cachingRecommended && (
                <div className="rec-card">
                  <i className="ti ti-database rec-icon" style={{ color: 'var(--green)' }} />
                  <div>
                    <div className="rec-title">Enable Prompt Caching</div>
                    <div className="rec-body">At {estimate.callsDay} calls/day, prompt caching on static context (system prompt, instructions) can reduce costs by 30–50%.</div>
                    <span className="rec-priority rec-high">High impact</span>
                  </div>
                </div>
              )}
              <div className="rec-card">
                <i className="ti ti-brain rec-icon" style={{ color: 'var(--gold)' }} />
                <div>
                  <div className="rec-title">Deterministic vs. AI Reasoning</div>
                  <div className="rec-body">Use deterministic logic (rules, lookups, formulas) for scoring, filtering, and routing decisions. Reserve AI reasoning for language generation and synthesis tasks where determinism would require complex rule engineering.</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setStep(3)}>← Back</button>
            <button className="btn btn-primary" onClick={() => { setBudget(String(Math.round(estimate.annualExpected * 1.2))); setStep(5) }}>Accept & Create Project →</button>
          </div>
        </div>
      )}

      {/* Step 5: Confirm */}
      {step === 5 && (
        <div className="fade-in" style={{ maxWidth: 480 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Ready to create</div>
          <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(212,185,106,0.3)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
              <span className={`project-type-badge ${type === 'existing' ? 'badge-existing' : 'badge-new'}`}>{type}</span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{name}</span>
            </div>
            {description && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>{description}</div>}
            {budget && <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18, color: 'var(--gold)' }}>${Number(budget).toLocaleString()} <span style={{ fontSize: 12, fontFamily: 'inherit', color: 'var(--muted)' }}>annual budget</span></div>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setStep(type === 'new' ? 4 : 2)}>← Back</button>
            <button className="btn btn-primary" onClick={handleCreate}><i className="ti ti-check" /> Create Project</button>
          </div>
        </div>
      )}
    </div>
  )
}
