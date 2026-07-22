import React, { useState, useRef, useEffect } from 'react'
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function askChatty({ question, page, projectId }) {
  const r = await fetch(`${API}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, page, projectId }),
  })
  const data = await r.json()
  if (!data.success) throw new Error(data.error)
  return data.answer
}

const SUGGESTED_QUESTIONS = {
  dashboard: [
    'Why is my monthly spend $116?',
    'Which project costs the most?',
    'Which model is driving the most spend?',
    'Are any guardrails close to being breached?',
    'How can I reduce my overall AI spend?',
  ],
  project: [
    'Why does this project cost this much?',
    'Why did spend increase this week?',
    'Which service costs the most?',
    'What happens if usage doubles?',
    'What if we switch to Haiku?',
    'What if we enable caching?',
    'Explain this project\'s architecture rating.',
    'What are the top recommendations?',
    'Explain this like I\'m presenting to executives.',
  ],
}

export default function FinOpsChatty({ page, projectId, projectName }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const scope = projectId ? 'project' : 'dashboard'
  const suggestions = SUGGESTED_QUESTIONS[scope] || SUGGESTED_QUESTIONS.dashboard

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        text: projectId
          ? `Hi! I'm FinOps Chatty. I know everything about **${projectName}** — spend, services, guardrails, decisions, and recommendations. What would you like to know?`
          : `Hi! I'm FinOps Chatty. I have full visibility into your Agentics Growth Lab AI portfolio — all projects, spend, guardrails, and recommendations. What would you like to know?`,
        ts: Date.now(),
      }])
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  async function send(question) {
    const q = question || input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q, ts: Date.now() }])
    setLoading(true)
    try {
      const answer = await askChatty({ question: q, page, projectId })
      setMessages(prev => [...prev, { role: 'assistant', text: answer, ts: Date.now() }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Sorry — I couldn't reach the backend. Please try again. (${err.message})`, ts: Date.now(), error: true }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function clearChat() {
    setMessages([])
    setTimeout(() => setOpen(true), 50)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 200,
          width: 52, height: 52, borderRadius: '50%',
          background: open ? 'var(--navy2)' : 'linear-gradient(135deg, var(--gold), var(--gold2))',
          border: open ? '2px solid var(--gold)' : 'none',
          color: open ? 'var(--gold)' : 'var(--navy)',
          fontSize: 22, cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 20px rgba(212,185,106,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.25s',
        }}
        title="FinOps Chatty"
      >
        <i className={`ti ${open ? 'ti-x' : 'ti-message-chatbot'}`} />
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 28, zIndex: 200,
          width: 400, height: 560,
          background: 'var(--navy3)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(212,185,106,0.08)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeSlideUp 0.25s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(212,185,106,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, var(--gold), var(--gold2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: 'var(--navy)',
              }}>
                <i className="ti ti-message-chatbot" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>FinOps Chatty</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>
                  {projectId ? `Viewing: ${projectName}` : 'Viewing: Full Portfolio'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={clearChat} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: 4 }} title="Clear chat">
                <i className="ti ti-trash" />
              </button>
            </div>
          </div>

          {/* Context badge */}
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border2)' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(14,122,92,0.12)', border: '1px solid rgba(14,122,92,0.3)',
              borderRadius: 20, padding: '3px 10px',
              fontSize: 10.5, color: '#34D399', fontWeight: 600,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
              Grounded in Neon data only · Never invents numbers
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, var(--gold), var(--gold2))'
                    : m.error ? 'var(--red-bg)' : 'rgba(255,255,255,0.06)',
                  color: m.role === 'user' ? 'var(--navy)' : m.error ? '#F87171' : 'var(--text)',
                  fontSize: 13,
                  lineHeight: 1.6,
                  fontWeight: m.role === 'user' ? 600 : 400,
                  border: m.role === 'assistant' ? '1px solid var(--border2)' : 'none',
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 5, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px 12px 12px 2px', width: 'fit-content', border: '1px solid var(--border2)' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)',
                    animation: `pulse 1.2s ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            )}

            {/* Suggested questions */}
            {messages.length <= 1 && !loading && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Suggested questions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {suggestions.slice(0, 4).map((q, i) => (
                    <button key={i} onClick={() => send(q)} style={{
                      background: 'rgba(212,185,106,0.06)',
                      border: '1px solid rgba(212,185,106,0.2)',
                      borderRadius: 8, padding: '8px 12px',
                      fontSize: 12, color: 'var(--muted)', cursor: 'pointer',
                      textAlign: 'left', lineHeight: 1.5,
                      transition: 'all 0.15s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(212,185,106,0.5)'; e.currentTarget.style.color = 'var(--text)' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(212,185,106,0.2)'; e.currentTarget.style.color = 'var(--muted)' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about spend, models, guardrails..."
              disabled={loading}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border2)', borderRadius: 10,
                padding: '9px 12px', color: 'var(--text)',
                fontSize: 13, resize: 'none', minHeight: 40, maxHeight: 100,
                fontFamily: 'inherit', lineHeight: 1.5,
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'}
              onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              rows={1}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: input.trim() && !loading ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
                border: 'none', color: input.trim() && !loading ? 'var(--navy)' : 'var(--muted)',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <i className={loading ? 'ti ti-loader spinning' : 'ti ti-send'} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
