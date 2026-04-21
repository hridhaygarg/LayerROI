import express from 'express';
import PDFDocument from 'pdfkit';
import { supabase } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

async function fetchAllLogs(orgId, monthStart) {
  const all = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('api_logs')
      .select('agent_id, agent_name, provider, cost_usd, value')
      .eq('org_id', orgId)
      .gte('created_at', monthStart.toISOString())
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function buildReportData(orgId) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const { data: org } = await supabase
    .from('organisations').select('name, plan, plan_agent_limit').eq('id', orgId).single();

  const { data: agents } = await supabase
    .from('agents').select('id, name, provider').eq('org_id', orgId);

  const logs = await fetchAllLogs(orgId, monthStart);

  const perAgent = {};
  (agents || []).forEach(a => { perAgent[a.id] = { id: a.id, name: a.name, provider: a.provider, cost: 0, value: 0, tasks: 0 }; });

  logs.forEach(l => {
    const key = l.agent_id || l.agent_name;
    if (!perAgent[key]) perAgent[key] = { id: key, name: l.agent_name || 'Unknown', provider: l.provider || 'unknown', cost: 0, value: 0, tasks: 0 };
    if (l.provider && perAgent[key].provider === 'unknown') perAgent[key].provider = l.provider;
    perAgent[key].cost += Number(l.cost_usd || 0);
    perAgent[key].value += Number(l.value || 0);
    perAgent[key].tasks += 1;
  });

  const hasValueData = Object.values(perAgent).some(a => a.value > 0);
  const agentRows = Object.values(perAgent).map(a => ({
    ...a,
    roi: a.cost > 0 && a.value > 0 ? a.value / a.cost : null,
    status: !hasValueData ? (a.cost > 0 ? 'tracking' : 'no_data')
      : a.cost === 0 && a.value === 0 ? 'no_data'
      : a.cost > 0 && a.value / a.cost >= 3 ? 'profitable'
      : a.cost > 0 && a.value / a.cost >= 1 ? 'marginal' : 'losing',
  }));

  const totalSpend = agentRows.reduce((s, a) => s + a.cost, 0);
  const totalValue = agentRows.reduce((s, a) => s + a.value, 0);
  const netRoi = totalSpend > 0 ? totalValue / totalSpend : null;
  const wasteful = agentRows.filter(a => a.roi != null && a.roi < 1).reduce((s, a) => s + a.cost, 0);

  return {
    org_name: org?.name || 'Organization',
    period: { start: monthStart.toISOString(), end: new Date().toISOString(), label: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) },
    kpis: { total_spend: totalSpend, total_value: totalValue, net_roi: netRoi, wasteful_spend: wasteful, agents_count: agentRows.length, tasks_count: logs.length },
    agents: agentRows.sort((a, b) => b.cost - a.cost),
    has_data: totalSpend > 0 || totalValue > 0,
    has_value: totalValue > 0,
  };
}

function fmtCurrency(n) { return n != null ? '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '$0'; }

function roiColorPdf(roi) {
  if (roi == null) return '#999';
  if (roi >= 3) return '#16a34a';
  if (roi >= 1) return '#d97706';
  return '#dc2626';
}

function buildSummary(data) {
  const { kpis, agents } = data;
  if (!kpis.total_spend) return 'No AI agent activity recorded this period.';
  const active = agents.filter(a => a.cost > 0).length;
  const hasValue = kpis.total_value > 0;

  if (!hasValue) {
    const topSpender = agents.reduce((top, a) => (a.cost > (top?.cost || 0) ? a : top), null);
    return `Across ${active} active agent${active === 1 ? '' : 's'} this period, layeroi tracked ${fmtCurrency(kpis.total_spend)} in AI spend. Value tagging is not yet configured — connect value reporting to see which agents are profitable.${topSpender ? ` Top spender: ${topSpender.name} at ${fmtCurrency(topSpender.cost)}.` : ''}`;
  }

  const profitable = agents.filter(a => a.roi != null && a.roi >= 3).length;
  const losing = agents.filter(a => a.roi != null && a.roi < 1 && a.cost > 0).length;
  const top = agents.reduce((best, a) => (a.value > (best?.value || 0) ? a : best), null);
  return `Across ${active} active agents, layeroi tracked ${fmtCurrency(kpis.total_spend)} in AI spend against ${fmtCurrency(kpis.total_value)} in value — a ${kpis.net_roi.toFixed(1)}× return. ${profitable} agent${profitable === 1 ? '' : 's'} profitable${losing > 0 ? `, ${losing} losing money` : ''}.${top ? ` Top performer: ${top.name} at ${(top.roi||0).toFixed(1)}× ROI.` : ''}`;
}

function renderReportPdf(doc, data) {
  const M = 56, W = 500;

  // Masthead — Stratified Spine mark + wordmark
  doc.moveTo(M, M).lineTo(M + W, M).lineWidth(0.75).strokeColor('#0a0a0a').stroke();
  // Draw mark
  const ms = 0.85;
  doc.save();
  doc.roundedRect(M + 5*ms, M + 12 + 5*ms, 14*ms, 2*ms, 0.6*ms).fillColor('#888888').fillOpacity(0.5).fill();
  doc.roundedRect(M + 5*ms, M + 12 + 8.5*ms, 19*ms, 2*ms, 0.6*ms).fillColor('#888888').fillOpacity(0.5).fill();
  doc.roundedRect(M + 5*ms, M + 12 + 12*ms, 10*ms, 2*ms, 0.6*ms).fillColor('#888888').fillOpacity(0.5).fill();
  doc.fillOpacity(1).roundedRect(M + 5*ms, M + 12 + 16*ms, 22*ms, 4*ms, 1*ms).fillColor('#22c55e').fill();
  doc.roundedRect(M + 5*ms, M + 12 + 23*ms, 22*ms, 4*ms, 1*ms).fillColor('#888888').fillOpacity(0.4).fill();
  doc.restore();
  doc.fillOpacity(1).fontSize(16).fillColor('#0a0a0a').font('Helvetica-Bold').text('layeroi', M + 30, M + 16);
  doc.fontSize(9).fillColor('#666').font('Courier').text(data.period.label.toUpperCase() + '  ·  REPORT', M, M + 18, { width: W, align: 'right' });

  // Title
  let y = M + 56;
  doc.fontSize(28).fillColor('#050505').font('Times-Italic').text('Monthly AI agent P&L', M, y);
  y += 38;
  doc.fontSize(10).fillColor('#666').font('Helvetica').text(`Prepared for ${data.org_name}  ·  ${data.period.label}`, M, y);
  y += 32;

  // Summary
  doc.fontSize(10).fillColor('#2a2a2a').font('Helvetica').text(buildSummary(data), M, y, { width: W, lineGap: 4 });
  y = doc.y + 28;

  // KPI cards
  const kpiW = (W - 24) / 3;
  [
    { label: 'TOTAL SPEND', value: fmtCurrency(data.kpis.total_spend) },
    { label: 'VALUE GENERATED', value: fmtCurrency(data.kpis.total_value) },
    { label: 'NET ROI', value: data.kpis.net_roi != null ? data.kpis.net_roi.toFixed(1) + '×' : '—' },
  ].forEach((k, i) => {
    const x = M + i * (kpiW + 12);
    doc.rect(x, y, kpiW, 80).fillColor(i === 2 ? '#f0fdf4' : '#fafafa').fill();
    doc.rect(x, y, 3, 80).fillColor(i === 2 ? '#22c55e' : '#d4d4d4').fill();
    doc.fontSize(8).fillColor('#888').font('Courier').text(k.label, x + 16, y + 14);
    doc.fontSize(22).fillColor(i === 2 ? '#22c55e' : '#050505').font('Courier-Bold').text(k.value, x + 16, y + 36);
  });
  y += 112;

  // Table
  doc.fontSize(14).fillColor('#050505').font('Times-Italic').text('Agent breakdown', M, y);
  y += 24;

  const visibleAgents = data.agents.filter(a => a.cost > 0 || a.value > 0);
  const hiddenCount = data.agents.length - visibleAgents.length;

  doc.fontSize(8).fillColor('#888').font('Courier');
  doc.text('AGENT', M, y); doc.text('PROVIDER', M + 135, y); doc.text('COST', M + 220, y, { width: 70, align: 'right' });
  doc.text('VALUE', M + 300, y, { width: 70, align: 'right' }); doc.text('ROI', M + 380, y, { width: 50, align: 'right' });
  doc.text('STATUS', M + 440, y);
  y += 14; doc.moveTo(M, y).lineTo(M + W, y).lineWidth(0.5).strokeColor('#e5e5e5').stroke(); y += 10;

  visibleAgents.forEach((a, i) => {
    if (i % 2 === 1) doc.rect(M, y - 4, W, 22).fillColor('#fafafa').fill();
    doc.fontSize(10).fillColor('#050505').font('Helvetica').text(a.name.slice(0, 20), M, y);
    doc.fontSize(9).fillColor('#666').font('Helvetica').text(a.provider || '—', M + 135, y);
    doc.fontSize(10).fillColor('#050505').font('Courier').text(fmtCurrency(a.cost), M + 220, y, { width: 70, align: 'right' });
    doc.fillColor('#22c55e').text(fmtCurrency(a.value), M + 300, y, { width: 70, align: 'right' });
    doc.fillColor(roiColorPdf(a.roi)).font('Courier-Bold').text(a.roi != null ? a.roi.toFixed(1) + '×' : '—', M + 380, y, { width: 50, align: 'right' });
    doc.fontSize(8).fillColor(roiColorPdf(a.roi)).font('Courier').text((a.status || '').replace('_', ' ').toUpperCase(), M + 440, y + 2);
    y += 22;
  });

  if (hiddenCount > 0) {
    y += 8;
    doc.fontSize(9).fillColor('#999').font('Helvetica-Oblique').text(`${hiddenCount} additional agent${hiddenCount === 1 ? '' : 's'} connected but not yet logging data.`, M, y);
  }

  // Footer
  doc.moveTo(M, 740).lineTo(M + W, 740).lineWidth(0.5).strokeColor('#e5e5e5').stroke();
  doc.fontSize(8).fillColor('#999').font('Courier').text(
    'GENERATED ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() + '  ·  LAYEROI.COM',
    M, 748, { width: W, align: 'center' }
  );
}

// GET /api/reports/latest
router.get('/api/reports/latest', async (req, res) => {
  try {
    const orgId = req.query.orgId;
    if (!orgId) return res.status(400).json({ error: 'orgId required' });
    const data = await buildReportData(orgId);
    res.json({ success: true, data });
  } catch (err) {
    logger.error('Reports latest error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/pdf
router.get('/api/reports/pdf', async (req, res) => {
  try {
    const orgId = req.query.orgId;
    if (!orgId) return res.status(400).json({ error: 'orgId required' });
    const data = await buildReportData(orgId);
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="layeroi-report-${data.period.label.replace(' ', '-')}.pdf"`);
    doc.pipe(res);
    renderReportPdf(doc, data);
    doc.end();
  } catch (err) {
    logger.error('Reports PDF error', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports/email
router.post('/api/reports/email', async (req, res) => {
  try {
    const { orgId, email } = req.body;
    if (!orgId || !email) return res.status(400).json({ error: 'orgId and email required' });
    const data = await buildReportData(orgId);
    const chunks = [];
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    doc.on('data', c => chunks.push(c));
    const done = new Promise(r => doc.on('end', r));
    renderReportPdf(doc, data);
    doc.end();
    await done;
    const pdfBuffer = Buffer.concat(chunks);

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'layeroi <hello@layeroi.com>',
      to: email,
      subject: `Your ${data.period.label} AI agent P&L report`,
      html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#0a0a0a;padding:32px 24px;text-align:center;border-radius:14px 14px 0 0;">
          <img src="https://layeroi.com/brand/layeroi-logo.svg" alt="layeroi" width="120" style="display:inline-block;max-width:120px;height:auto;">
        </div>
        <div style="padding:32px 24px;">
        <h1 style="font-family:Georgia,serif;font-style:italic;font-size:24px;margin:0 0 12px;">${data.period.label} Report</h1>
        <p style="color:#444;line-height:1.6;">${buildSummary(data)}</p>
        <p style="color:#444;">Full breakdown in the attached PDF.</p>
        </div>
      </div>`,
      attachments: [{ filename: `layeroi-report-${data.period.label.replace(' ', '-')}.pdf`, content: pdfBuffer }],
    });
    res.json({ success: true, data: { sent_to: email } });
  } catch (err) {
    logger.error('Reports email error', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
