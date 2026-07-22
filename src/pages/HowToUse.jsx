import React, { useState } from 'react'

const JOURNEY = [
  {
    step: 1,
    icon: 'ti-plus',
    color: 'var(--steel)',
    title: 'Create Your First Project',
    time: '2 minutes',
    description: 'Every governance journey starts with a project. A project is a container for one AI application — its services, costs, guardrails, decisions, and architecture review.',
    actions: [
      'Click New Project in the left navigation',
      'Choose Existing (running app) or New (designing from scratch)',
      'Enter a project name, description, and annual AI budget',
      'Click Create — your project is now in Neon and persisted permanently',
    ],
    tips: [
      'Be specific with the description — FinOps Chatty uses it for context',
      'Set a realistic annual budget — the studio tracks variance against it',
      'You can create multiple projects — one per AI application',
    ],
    output: 'A live project card on your Dashboard with A/B/C/D rating and spend tracking',
  },
  {
    step: 2,
    icon: 'ti-topology-star',
    color: '#8B5CF6',
    title: 'Complete the Architecture Interview',
    time: '5 minutes',
    description: 'The Architecture Interview is the most important step for new projects. Answer 8 questions about your AI use case and get a cost estimate with a Claude-generated architecture review — before writing a single line of code.',
    actions: [
      'Open your project → click the Architecture Review tab',
      'Answer all 8 questions (purpose, users, frequency, context, output, quality, latency, compliance)',
      'Click Generate Estimate — see Low/Expected/High monthly cost ranges',
      'Click Generate AI Summary & Save — Claude reviews your inputs and saves the result to Neon',
    ],
    tips: [
      'The more detail in your answers, the more accurate the estimate',
      'Quality: High → Sonnet recommended. Medium/Low → Haiku may suffice',
      'Compliance requirements affect model selection — be specific',
      'You can Update Review anytime as your requirements evolve',
    ],
    output: 'Saved architecture review with Claude summary, cost estimate, and model recommendations',
  },
  {
    step: 3,
    icon: 'ti-database',
    color: 'var(--gold)',
    title: 'Add Your AI Services',
    time: '3 minutes per service',
    description: 'Services are the individual AI calls in your application. Each service has a model, daily call volume, and token usage. The studio calculates monthly cost from the server-maintained pricing table — not estimates.',
    actions: [
      'Open your project → click the Services tab',
      'Click Add Service',
      'Enter the service name, select the model, enter calls/day, prompt tokens, and completion tokens',
      'Toggle Caching Enabled if you use prompt caching',
      'Click Add Service — cost is calculated instantly from the pricing table',
    ],
    tips: [
      'Add one service per distinct AI workflow (email drafting, meeting prep, etc.)',
      'Use actual token counts from your logs if available — otherwise estimate conservatively',
      'Caching enabled = lower cost; mark it accurately',
      'Cost rating (A/B/C/D) updates automatically as you add services',
    ],
    output: 'Live cost breakdown per service, total monthly run rate, and cost efficiency rating',
  },
  {
    step: 4,
    icon: 'ti-shield-check',
    color: 'var(--green)',
    title: 'Configure Guardrails',
    time: '3 minutes',
    description: 'Guardrails are your early warning system. They check spend, drift, model usage, and prompt efficiency — and alert you before problems reach your monthly bill.',
    actions: [
      'Open your project → click the Guardrails tab',
      'Click Add Guardrail',
      'Choose a guardrail type (monthly ceiling, weekly drift, cost per interaction, etc.)',
      'Set the threshold and action (alert, warn, or block)',
      'Repeat for each guardrail type relevant to your project',
    ],
    tips: [
      'Start with Monthly Spend Ceiling and Week-over-Week Drift at minimum',
      'Set ceiling at 120% of expected spend — gives headroom without surprises',
      'Add Caching Required if your architecture calls for it — keeps the team honest',
      'Model Change Approval guardrail is powerful for regulated environments',
    ],
    output: 'Active guardrails that update the project risk level and architecture score',
  },
  {
    step: 5,
    icon: 'ti-clipboard-check',
    color: 'var(--amber)',
    title: 'Log Architecture Decisions',
    time: '2 minutes per decision',
    description: 'Decisions are the governance record of your AI architecture. When you choose a model, enable caching, or decide on a retrieval strategy — log it here with rationale, cost impact, and approval status.',
    actions: [
      'Open your project → click the Decisions tab',
      'Click Log Decision',
      'Enter the decision title and rationale',
      'Set quality impact, cost impact (e.g. -78%), risk impact, and owner',
      'Set status to Pending (for review) or Approved (already decided)',
    ],
    tips: [
      'Log decisions as you make them — not retroactively',
      'The cost impact field is especially valuable for leadership reports',
      'Owner field enables accountability — use actual names',
      'Decisions feed directly into the Leadership PPT report',
    ],
    output: 'A traceable decision record visible in project detail and exported to leadership PPT',
  },
  {
    step: 6,
    icon: 'ti-message-chatbot',
    color: 'var(--steel)',
    title: 'Ask FinOps Chatty',
    time: 'Ongoing',
    description: 'FinOps Chatty is your AI FinOps advisor — available on every page, aware of your current project or portfolio context, and grounded only in your real Neon data. It never invents numbers.',
    actions: [
      'Click the gold chat bubble in the bottom right corner',
      'Ask any question about spend, models, guardrails, or architecture',
      'Use suggested questions as a starting point',
      'Ask "Explain this like I\'m presenting to executives" for executive summaries',
    ],
    tips: [
      'Chatty knows which project you\'re viewing — no need to specify',
      'Ask about specific services: "Why does Email Draft Generation cost $42/month?"',
      'Ask scenario questions: "What if usage doubles next quarter?"',
      'On the Dashboard, Chatty sees your full portfolio — not just one project',
    ],
    output: 'Plain-language explanations of your AI spend, architecture, and optimization opportunities',
  },
  {
    step: 7,
    icon: 'ti-adjustments-horizontal',
    color: 'var(--gold)',
    title: 'Plan Scenarios',
    time: '5 minutes',
    description: 'Before committing to a growth plan, model change, or architecture shift — use Scenario Planning to see the financial impact in advance.',
    actions: [
      'Click Scenario Planning in the left navigation',
      'Select a project',
      'Adjust the Usage Growth Multiplier (e.g. 2× for doubling usage)',
      'Optionally select a model change to see cost differential',
      'Review projected monthly, annual spend, and budget impact',
    ],
    tips: [
      'Run the 3× scenario before any major growth initiative',
      'Use model change to evaluate Haiku vs Sonnet on your actual usage volume',
      'Budget impact turns red when forecast exceeds annual budget — plan accordingly',
      'Share scenario screenshots in leadership discussions before committing to growth',
    ],
    output: 'Financial projections for growth and architecture change scenarios',
  },
  {
    step: 8,
    icon: 'ti-presentation',
    color: 'var(--gold)',
    title: 'Export Leadership Report',
    time: '30 seconds',
    description: 'When it\'s time to present to leadership, generate a professional executive PowerPoint in one click — built from live data, never manually assembled.',
    actions: [
      'Click Leadership Reports in the left navigation',
      'Choose a project report or the full portfolio executive summary',
      'Click Download PPT',
      'Open the downloaded .pptx file — ready to present',
    ],
    tips: [
      'Generate the report right before your meeting — it\'s always current',
      'Complete the Architecture Review first — it powers slide 3 of the report',
      'Add decisions before generating — they appear in the decisions slide',
      'The executive summary aggregates all projects for a portfolio view',
    ],
    output: 'A 5-slide navy/gold PowerPoint with executive summary, architecture, cost, decisions, and recommendations',
  },
]

export default function HowToUse() {
  const [active, setActive] = useState(1)

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">How to Use This Product</div>
        <div className="page-sub">A complete guide to governing AI spend — from first project to leadership report</div>
      </div>

      {/* Journey overview */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-title">The Complete Governance Journey</div>
        <div style={{ display: 'flex', gap: 0, alignItems: 'center', flexWrap: 'wrap' }}>
          {JOURNEY.map((j, i) => (
            <React.Fragment key={j.step}>
              <div
                onClick={() => setActive(j.step)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 12px', cursor: 'pointer', borderRadius: 8, background: active === j.step ? 'rgba(212,185,106,0.08)' : 'transparent', border: active === j.step ? '1px solid rgba(212,185,106,0.25)' : '1px solid transparent', transition: 'all 0.2s' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: active === j.step ? j.color : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                  <i className={`ti ${j.icon}`} style={{ fontSize: 14, color: active === j.step ? 'var(--navy)' : 'var(--muted)' }} />
                </div>
                <span style={{ fontSize: 9.5, color: active === j.step ? 'var(--gold)' : 'var(--muted)', fontWeight: active === j.step ? 700 : 400, textAlign: 'center', maxWidth: 60, lineHeight: 1.3 }}>{j.title.split(' ').slice(0, 3).join(' ')}</span>
              </div>
              {i < JOURNEY.length - 1 && (
                <div style={{ height: 1, width: 12, background: 'var(--border2)', flexShrink: 0 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Active step detail */}
      {JOURNEY.filter(j => j.step === active).map(j => (
        <div key={j.step} className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ti ${j.icon}`} style={{ fontSize: 22, color: j.color }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Step {j.step}: {j.title}</div>
                <span style={{ fontSize: 11, color: j.color, fontWeight: 600, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4 }}>⏱ {j.time}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{j.description}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="card">
              <div className="card-title" style={{ color: j.color }}>How to do it</div>
              {j.actions.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < j.actions.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: j.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: 'var(--navy)' }}>{i + 1}</div>
                  <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{a}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-title">Pro tips</div>
                {j.tips.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < j.tips.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                    <i className="ti ti-bulb" style={{ fontSize: 13, color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>{t}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(212,185,106,0.06)', border: '1px solid rgba(212,185,106,0.2)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>✦ What you get</div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{j.output}</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-ghost" disabled={j.step === 1} onClick={() => setActive(j.step - 1)}>
              <i className="ti ti-arrow-left" /> Previous Step
            </button>
            <div style={{ display: 'flex', gap: 6 }}>
              {JOURNEY.map(step => (
                <button key={step.step} onClick={() => setActive(step.step)} style={{ width: step.step === active ? 20 : 7, height: 7, borderRadius: 4, background: step.step === active ? 'var(--gold)' : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />
              ))}
            </div>
            <button className="btn btn-primary" disabled={j.step === JOURNEY.length} onClick={() => setActive(j.step + 1)}>
              Next Step <i className="ti ti-arrow-right" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
