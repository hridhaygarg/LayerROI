import { useState, useEffect } from 'react';
import { Icon } from './components/Icon';

const API_BASE = 'https://api.layeroi.com';

export default function Report() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [emailing, setEmailing] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const org = JSON.parse(localStorage.getItem('layeroi_org') || 'null');
  const user = JSON.parse(localStorage.getItem('layeroi_user') || 'null');
  const token = localStorage.getItem('layeroi_token');

  useEffect(() => {
    let orgId = org?.id;
    if (!orgId) { try { orgId = JSON.parse(atob(token.split('.')[1])).orgId; } catch(e) {} }
    if (!orgId) { setLoading(false); return; }
    fetch(`${API_BASE}/api/reports/latest?orgId=${orgId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getOrgId = () => {
    let id = org?.id;
    if (!id) { try { id = JSON.parse(atob(token.split('.')[1])).orgId; } catch(e) {} }
    return id;
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/pdf?orgId=${getOrgId()}`, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `layeroi-report-${data?.period?.label?.replace(' ', '-') || 'current'}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } finally { setDownloading(false); }
  };

  const handleEmail = async () => {
    setEmailing(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orgId: getOrgId(), email: user?.email }),
      });
      if (res.ok) { setEmailSent(true); setTimeout(() => setEmailSent(false), 4000); }
    } finally { setEmailing(false); }
  };

  const fmt = {
    currency: (n) => n != null ? `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '$0',
    multiple: (n) => n != null ? `${Number(n).toFixed(1)}×` : '—',
  };

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className='serif' style={{ fontSize: '40px', lineHeight: 1.1, color: 'var(--white, white)', margin: 0 }}>Reports</h1>
          <p style={{ color: 'var(--white-55, rgba(255,255,255,0.55))', fontSize: '14px', marginTop: '6px' }}>
            Board-ready P&L for your AI agents. {data?.period?.label || 'Current month'}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleEmail} disabled={emailing || !data?.has_data}
            style={{ padding: '10px 16px', background: 'transparent', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: data?.has_data ? 'pointer' : 'not-allowed', opacity: data?.has_data ? 1 : 0.5 }}>
            {emailSent ? '✓ Sent' : emailing ? 'Sending…' : 'Email report'}
          </button>
          <button onClick={handleDownload} disabled={downloading || !data?.has_data}
            style={{ padding: '10px 16px', background: '#22c55e', color: '#050505', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: data?.has_data ? 'pointer' : 'not-allowed', opacity: data?.has_data ? 1 : 0.5 }}>
            {downloading ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </header>

      {loading ? (
        <div style={{ height: '200px', background: '#0f0f0f', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }} />
      ) : !data?.has_data ? (
        <section style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#22c55e' }}>
            <Icon name='reports' size={22} />
          </div>
          <h2 className='serif' style={{ fontSize: '26px', color: 'white', margin: '0 0 10px' }}>No data yet</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14.5px', lineHeight: 1.6, margin: '0 auto', maxWidth: '480px' }}>
            Reports populate within an hour of connecting your first source. Head to <a href="/sources" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('navigate-screen', { detail: { screen: 'sources' } })); }} style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 500 }}>Sources</a> to connect OpenAI, Anthropic, or AWS Bedrock.
          </p>
        </section>
      ) : (
        <>
          <section style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '24px 28px', marginBottom: '20px' }}>
            <div className='mono' style={{ fontSize: '10px', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.12em', marginBottom: '10px' }}>EXECUTIVE SUMMARY</div>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: 0 }}>
              {buildSummary(data)}
            </p>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
            <KPICard label='TOTAL SPEND' value={fmt.currency(data.kpis.total_spend)} sublabel='this month' />
            <KPICard label='VALUE GENERATED' value={fmt.currency(data.kpis.total_value)} sublabel='estimated' tone='positive' />
            <KPICard label='NET ROI' value={fmt.multiple(data.kpis.net_roi)} sublabel='profit ratio' highlight />
          </section>

          <section style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className='serif' style={{ fontSize: '22px', color: 'white', margin: 0 }}>Agent breakdown</h2>
              <span className='mono' style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em' }}>
                {data.agents.length} AGENTS · {(data.kpis.tasks_count ?? 0).toLocaleString()} TASKS
              </span>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr 1fr', gap: '12px', padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a' }}>
                {['AGENT', 'PROVIDER', 'COST', 'VALUE', 'ROI', 'STATUS'].map(h => (
                  <span key={h} className='mono' style={{ fontSize: '10px', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.12em' }}>{h}</span>
                ))}
              </div>
              {data.agents.map((a, i) => (
                <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.8fr 1fr', gap: '12px', padding: '14px 24px', borderBottom: i === data.agents.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
                  <span className='mono' style={{ fontSize: '13px', color: 'rgba(255,255,255,0.95)' }}>{a.name}</span>
                  <span className='mono' style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{a.provider}</span>
                  <span className='mono' style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{fmt.currency(a.cost)}</span>
                  <span className='mono' style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{fmt.currency(a.value)}</span>
                  <span className='mono' style={{ fontSize: '13px', fontWeight: 700, color: roiColor(a.roi) }}>{fmt.multiple(a.roi)}</span>
                  <span className='mono' style={{ fontSize: '10px', color: roiColor(a.roi), letterSpacing: '0.08em' }}>{(a.status || 'no_data').toUpperCase()}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

function KPICard({ label, value, sublabel, tone, highlight }) {
  const color = tone === 'positive' || highlight ? '#22c55e' : 'white';
  const bg = highlight ? 'linear-gradient(180deg, rgba(34,197,94,0.04) 0%, #0f0f0f 100%)' : '#0f0f0f';
  const border = highlight ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.06)';
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '14px', padding: '20px' }}>
      <div className='mono' style={{ fontSize: '10px', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.12em', marginBottom: '12px' }}>{label}</div>
      <div className='mono' style={{ fontSize: '30px', fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '8px' }}>{sublabel}</div>
    </div>
  );
}

function buildSummary(data) {
  const { kpis, agents } = data;
  if (!kpis.total_spend) return 'No AI agent activity recorded this period.';
  const fmtC = (n) => '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const active = agents.filter(a => a.cost > 0).length;
  const profitable = agents.filter(a => a.roi != null && a.roi >= 3).length;
  const losing = agents.filter(a => a.roi != null && a.roi < 1).length;
  const top = agents.reduce((best, a) => (a.value > (best?.value || 0) ? a : best), null);
  return `Across ${active} active agents, layeroi tracked ${fmtC(kpis.total_spend)} in AI spend against ${fmtC(kpis.total_value)} in value — a ${kpis.net_roi.toFixed(1)}× return. ${profitable} agent${profitable === 1 ? '' : 's'} profitable${losing > 0 ? `, ${losing} losing money` : ''}.${top ? ` Top performer: ${top.name} at ${(top.roi||0).toFixed(1)}× ROI.` : ''}`;
}

function roiColor(roi) {
  if (roi == null) return 'rgba(255,255,255,0.38)';
  if (roi >= 3) return '#22c55e';
  if (roi >= 1) return '#f59e0b';
  return '#ef4444';
}
