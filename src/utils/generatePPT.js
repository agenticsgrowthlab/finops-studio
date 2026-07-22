import PptxGenJS from 'pptxgenjs'

const NAVY  = '0F2240'
const NAVY2 = '1B3A6B'
const GOLD  = 'D4B96A'
const GOLD2 = 'B89A4A'
const WHITE = 'FFFFFF'
const MUTED = '7A90B0'
const GREEN = '0E7A5C'
const AMBER = 'D97706'
const RED   = 'B83232'
const STEEL = '2E75B6'

function ratingColor(r) {
  if (r === 'A') return GREEN
  if (r === 'B') return STEEL
  if (r === 'C') return AMBER
  return RED
}

function formatCost(n) {
  const num = Number(n) || 0
  if (num >= 1000) return `$${(num/1000).toFixed(1)}k`
  return `$${num.toFixed(2)}`
}

function monthlySpend(project) {
  return (project.services || []).reduce((s, svc) => s + (Number(svc.cost_month) || 0), 0)
}

function addBG(slide) {
  slide.addShape('rect', { x:0, y:0, w:'100%', h:'100%', fill:{ color:NAVY } })
}

function addGoldBar(slide) {
  slide.addShape('rect', { x:0, y:0, w:'100%', h:0.08, fill:{ color:GOLD } })
}

function addTitle(slide, title, sub) {
  slide.addText(title, { x:0.5, y:0.2, w:12.3, h:0.5, fontSize:24, fontFace:'Calibri', bold:true, color:WHITE })
  if (sub) slide.addText(sub, { x:0.5, y:0.72, w:12.3, h:0.28, fontSize:11, fontFace:'Calibri', color:MUTED, italic:true })
  slide.addShape('rect', { x:0.5, y:1.05, w:12.3, h:0.02, fill:{ color:GOLD2 } })
}

function addKPI(slide, x, y, w, label, value, sub, vc) {
  slide.addShape('rect', { x, y, w, h:1.1, fill:{ color:NAVY2 }, line:{ color:GOLD2, width:0.5 }, rounding:true })
  slide.addText(label.toUpperCase(), { x:x+0.15, y:y+0.08, w:w-0.3, h:0.2, fontSize:8, fontFace:'Calibri', bold:true, color:MUTED })
  slide.addText(value, { x:x+0.15, y:y+0.26, w:w-0.3, h:0.45, fontSize:22, fontFace:'Courier New', bold:true, color:vc||GOLD })
  if (sub) slide.addText(sub, { x:x+0.15, y:y+0.74, w:w-0.3, h:0.2, fontSize:9, fontFace:'Calibri', color:MUTED })
}

export async function generateProjectPPT(project) {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'AI FinOps Architecture Studio'
  pptx.company = 'Agentics Growth Lab'

  const spend    = monthlySpend(project)
  const forecast = spend * 12
  const budget   = Number(project.budget_annual) || 0
  const variance = budget > 0 ? ((forecast - budget) / budget * 100) : 0

  // ── Slide 1: Cover ──────────────────────────────────────────────────────
  const s1 = pptx.addSlide()
  addBG(s1)
  s1.addShape('rect', { x:0, y:0, w:'100%', h:0.12, fill:{ color:GOLD } })
  s1.addShape('rect', { x:0, y:6.88, w:'100%', h:0.12, fill:{ color:GOLD } })
  s1.addText('AI FinOps Architecture Studio', { x:0.5, y:1.2, w:12.3, h:0.4, fontSize:13, fontFace:'Calibri', color:GOLD, bold:true, align:'center' })
  s1.addText(project.name, { x:0.5, y:1.8, w:12.3, h:1.0, fontSize:38, fontFace:'Calibri', color:WHITE, bold:true, align:'center' })
  s1.addText('Architecture & FinOps Leadership Report', { x:0.5, y:2.9, w:12.3, h:0.4, fontSize:16, fontFace:'Calibri', color:MUTED, align:'center', italic:true })
  s1.addShape('rect', { x:4.5, y:3.45, w:4.3, h:0.03, fill:{ color:GOLD2 } })
  s1.addText([
    { text:'Cost Rating: ', options:{ color:MUTED } },
    { text:project.cost_score||'B', options:{ color:GOLD, bold:true } },
    { text:'   |   Risk: ', options:{ color:MUTED } },
    { text:project.risk_level||'low', options:{ color:WHITE, bold:true } },
    { text:'   |   Arch Score: ', options:{ color:MUTED } },
    { text:String(project.arch_score||85), options:{ color:GOLD, bold:true } },
  ], { x:0.5, y:3.65, w:12.3, h:0.4, fontSize:13, fontFace:'Calibri', align:'center' })
  s1.addText(`Agentics Growth Lab  ·  ${new Date().toLocaleDateString('en-US',{ month:'long', year:'numeric' })}`, { x:0.5, y:6.3, w:12.3, h:0.3, fontSize:10, fontFace:'Calibri', color:MUTED, align:'center' })

  // ── Slide 2: Executive Summary ──────────────────────────────────────────
  const s2 = pptx.addSlide()
  addBG(s2); addGoldBar(s2)
  addTitle(s2, 'Executive Summary', project.description?.slice(0,120))
  addKPI(s2, 0.5,  1.2, 2.8, 'Monthly Run Rate', formatCost(spend), `Budget ${formatCost(budget/12)}/mo`, GOLD)
  addKPI(s2, 3.5,  1.2, 2.8, 'Annual Forecast',  formatCost(forecast), `${variance>0?'↑':'↓'} ${Math.abs(variance).toFixed(1)}% vs budget`, variance>20?RED:GOLD)
  addKPI(s2, 6.5,  1.2, 2.8, 'Arch Score',       `${project.arch_score||85}/100`, 'Architecture quality', project.arch_score>=80?GREEN:project.arch_score>=60?AMBER:RED)
  addKPI(s2, 9.5,  1.2, 2.8, 'Cost Efficiency',  project.cost_score||'B', `${project.risk_level||'low'} risk`, ratingColor(project.cost_score||'B'))

  s2.addText('AI SERVICES', { x:0.5, y:2.55, w:5.8, h:0.22, fontSize:9, fontFace:'Calibri', bold:true, color:GOLD })
  ;(project.services||[]).slice(0,5).forEach((svc,i) => {
    const y = 2.82 + i*0.42
    s2.addShape('rect', { x:0.5, y, w:5.8, h:0.36, fill:{ color:NAVY2 }, rounding:true })
    s2.addText(svc.name, { x:0.65, y:y+0.04, w:3.5, h:0.22, fontSize:10, fontFace:'Calibri', bold:true, color:WHITE })
    s2.addText(formatCost(svc.cost_month)+'/mo', { x:4.4, y:y+0.04, w:1.7, h:0.22, fontSize:10, fontFace:'Courier New', color:GOLD, align:'right' })
    s2.addText(svc.model_id?.replace('claude-','Claude ').replace(/-/g,' ')||'', { x:0.65, y:y+0.2, w:4, h:0.14, fontSize:8, fontFace:'Calibri', color:MUTED })
  })

  s2.addText('GUARDRAIL STATUS', { x:6.8, y:2.55, w:6, h:0.22, fontSize:9, fontFace:'Calibri', bold:true, color:GOLD })
  ;(project.guardrails||[]).slice(0,5).forEach((g,i) => {
    const y = 2.82 + i*0.42
    const sc = g.status==='active'?GREEN:g.status==='warning'?AMBER:RED
    s2.addShape('rect', { x:6.8, y, w:6.0, h:0.36, fill:{ color:NAVY2 }, rounding:true })
    s2.addShape('ellipse', { x:6.94, y:y+0.12, w:0.12, h:0.12, fill:{ color:sc } })
    s2.addText(g.label||g.type, { x:7.12, y:y+0.04, w:4, h:0.22, fontSize:10, fontFace:'Calibri', bold:true, color:WHITE })
    s2.addText(g.status?.toUpperCase()||'ACTIVE', { x:11.0, y:y+0.04, w:1.6, h:0.22, fontSize:9, fontFace:'Calibri', bold:true, color:sc, align:'right' })
    if (g.threshold) s2.addText(`Threshold: ${g.threshold}`, { x:7.12, y:y+0.22, w:4, h:0.14, fontSize:8, fontFace:'Calibri', color:MUTED })
  })

  // ── Slide 3: Architecture Review ────────────────────────────────────────
  const s3 = pptx.addSlide()
  addBG(s3); addGoldBar(s3)
  addTitle(s3, 'Architecture Review', 'Claude AI architecture assessment — grounded in project data')

  const review = project.arch_review
  const summary = review?.claude_summary || review?.recommended_arch || null
  if (summary && summary.length > 10) {
    const clean = summary.replace(/#{1,3} /g,'').replace(/\*\*/g,'')
    s3.addText(clean.slice(0,1400), { x:0.5, y:1.2, w:12.3, h:5.4, fontSize:10, fontFace:'Calibri', color:MUTED, valign:'top', wrap:true, paraSpaceBefore:8 })
  } else if (review) {
    // Review exists but no summary — show what we have
    const ia = review.interview_answers || {}
    const lines = Object.entries(typeof ia === 'string' ? JSON.parse(ia) : ia).map(([k,v]) => `${k}: ${v}`).join('\n')
    s3.addText('Architecture review on file. Summary:\n\n' + (lines || 'See project for details.'), { x:0.5, y:1.2, w:12.3, h:5.4, fontSize:11, fontFace:'Calibri', color:MUTED, valign:'top', wrap:true })
  } else {
    s3.addText('No architecture review generated yet.\nUse the Architecture Review tab to generate one.', { x:0.5, y:3.0, w:12.3, h:1.5, fontSize:14, fontFace:'Calibri', color:MUTED, align:'center', italic:true })
  }

  // ── Slide 4: Decisions & Recommendations ────────────────────────────────
  const s4 = pptx.addSlide()
  addBG(s4); addGoldBar(s4)
  addTitle(s4, 'Decisions & Recommendations', 'Architecture decisions with impact tracking and optimization guidance')

  s4.addText('ARCHITECTURE DECISIONS', { x:0.5, y:1.2, w:5.8, h:0.22, fontSize:9, fontFace:'Calibri', bold:true, color:GOLD })
  const decisions = project.decisions||[]
  if (decisions.length === 0) {
    s4.addText('No decisions logged yet.', { x:0.5, y:1.6, w:5.8, h:0.4, fontSize:11, fontFace:'Calibri', color:MUTED, italic:true })
  } else {
    decisions.slice(0,4).forEach((d,i) => {
      const y = 1.5 + i*1.1
      const sc = d.status==='approved'?GREEN:d.status==='rejected'?RED:AMBER
      s4.addShape('rect', { x:0.5, y, w:5.8, h:1.0, fill:{ color:NAVY2 }, rounding:true })
      s4.addText(d.title, { x:0.65, y:y+0.06, w:4.3, h:0.28, fontSize:10, fontFace:'Calibri', bold:true, color:WHITE })
      s4.addText(d.status?.toUpperCase()||'', { x:5.1, y:y+0.06, w:1.05, h:0.22, fontSize:8, fontFace:'Calibri', bold:true, color:sc, align:'right' })
      if (d.rationale) s4.addText(d.rationale.slice(0,130), { x:0.65, y:y+0.36, w:5.5, h:0.36, fontSize:8, fontFace:'Calibri', color:MUTED })
      if (d.cost_impact) s4.addText(`Cost impact: ${d.cost_impact}`, { x:0.65, y:y+0.76, w:3, h:0.18, fontSize:8, fontFace:'Calibri', color:GOLD })
    })
  }

  s4.addText('TOP RECOMMENDATIONS', { x:6.8, y:1.2, w:6, h:0.22, fontSize:9, fontFace:'Calibri', bold:true, color:GOLD })
  const recs = project.recommendations||[]
  if (recs.length === 0) {
    s4.addText('No recommendations at this time.', { x:6.8, y:1.6, w:6.0, h:0.4, fontSize:11, fontFace:'Calibri', color:MUTED, italic:true })
  } else {
    recs.slice(0,4).forEach((r,i) => {
      const y = 1.5 + i*1.1
      const pc = r.priority==='high'?RED:r.priority==='medium'?AMBER:GREEN
      s4.addShape('rect', { x:6.8, y, w:6.0, h:1.0, fill:{ color:NAVY2 }, rounding:true })
      s4.addText(r.title, { x:6.95, y:y+0.06, w:4.5, h:0.28, fontSize:10, fontFace:'Calibri', bold:true, color:WHITE })
      s4.addText(r.priority?.toUpperCase()||'', { x:11.3, y:y+0.06, w:1.3, h:0.22, fontSize:8, fontFace:'Calibri', bold:true, color:pc, align:'right' })
      s4.addText(r.body?.slice(0,160)||'', { x:6.95, y:y+0.36, w:5.7, h:0.55, fontSize:8, fontFace:'Calibri', color:MUTED })
    })
  }

  // ── Slide 5: Closing ────────────────────────────────────────────────────
  const s5 = pptx.addSlide()
  addBG(s5)
  s5.addShape('rect', { x:0, y:0, w:'100%', h:0.12, fill:{ color:GOLD } })
  s5.addShape('rect', { x:0, y:6.88, w:'100%', h:0.12, fill:{ color:GOLD } })
  s5.addText('AI recommends · Humans approve\nEnterprise systems execute', { x:0.5, y:2.5, w:12.3, h:1.2, fontSize:26, fontFace:'Calibri', color:GOLD, bold:true, align:'center' })
  s5.addText('Agentics Growth Lab · AI FinOps Architecture Studio', { x:0.5, y:3.9, w:12.3, h:0.4, fontSize:13, fontFace:'Calibri', color:MUTED, align:'center' })
  s5.addText('FinOps Foundation aligned · React · Neon Postgres · Anthropic Claude · Vercel', { x:0.5, y:4.4, w:12.3, h:0.3, fontSize:10, fontFace:'Calibri', color:MUTED, align:'center', italic:true })

  await pptx.writeFile({ fileName:`${project.name.replace(/[^a-z0-9]/gi,'_')}_FinOps_Report.pptx` })
}
