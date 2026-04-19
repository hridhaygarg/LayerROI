import '../styles/designSystem.css';

const PAGES = {
  '/ai-agent-cost-tracking': {
    title: 'AI Agent Cost Tracking',
    headline: 'Track every dollar your AI agents spend.',
    subheadline: 'in real-time, per agent, per model.',
    description: 'layeroi gives you per-agent cost attribution across OpenAI, Anthropic, Google, and Azure. Know exactly which agents are spending what — and whether they are earning it back.',
    stats: [
      { value: '<5ms', label: 'Proxy overhead' },
      { value: '200+', label: 'Teams tracking costs' },
      { value: '23%', label: 'Average waste discovered' },
      { value: '15 min', label: 'Time to first data point' },
    ],
    features: [
      { title: 'Per-Agent Cost Attribution', desc: 'Every API call is tagged to a specific agent. No more guessing which agent is burning your budget from a single aggregated invoice.' },
      { title: 'Multi-Provider Support', desc: 'Track costs across OpenAI, Anthropic, Google Gemini, Azure OpenAI, and any OpenAI-compatible endpoint — all in one dashboard.' },
      { title: 'Real-Time Dashboard', desc: 'Costs update every 30 seconds. See spend-per-minute, daily trends, and month-to-date totals without waiting for monthly invoices.' },
      { title: 'Model-Level Breakdown', desc: 'See exactly how much you spend on GPT-4o vs GPT-4o-mini vs Claude Sonnet. Identify where model downgrades could save thousands.' },
      { title: 'Budget Alerts', desc: 'Set spending limits per agent. Get warned at 80%, throttled at 95%, and blocked at 100%. No more runaway bills.' },
      { title: 'Weekly Reports', desc: 'Automated PDF reports delivered to your CFO every Monday morning. Board-ready, no engineering translation needed.' },
    ],
    cta: 'Start tracking costs — free for 2 agents',
  },

  '/ai-agent-roi': {
    title: 'AI Agent ROI Calculator & Tracking',
    headline: 'Prove your AI agents are worth the investment.',
    subheadline: 'with real P&L data, not guesswork.',
    description: 'layeroi calculates ROI per agent by tracking both cost (automatic) and business value (configurable). Every agent gets a live profit & loss statement — the same financial instrument your CFO uses for business units.',
    stats: [
      { value: '4.5×', label: 'Average ROI across profitable agents' },
      { value: '40%', label: 'AI projects cancelled due to unclear ROI' },
      { value: '70%', label: 'Teams find unprofitable agents in week 1' },
      { value: '$129K', label: 'Average annual waste identified' },
    ],
    features: [
      { title: 'Per-Agent P&L', desc: 'Every agent gets a real-time profit & loss statement. Revenue minus cost equals margin. Displayed as an ROI multiple your board understands.' },
      { title: 'Business Value Attribution', desc: 'Three ways to attribute value: per-call headers, batch API uploads, or automatic CRM integration (Salesforce, HubSpot, Stripe).' },
      { title: 'ROI Benchmarks', desc: 'See how your agents compare to industry benchmarks. Know if your 3× ROI agent is above or below average for its category.' },
      { title: 'Trend Analysis', desc: 'Track ROI over time. Catch agents whose profitability is declining before they cross into negative territory.' },
      { title: 'Board-Ready Reports', desc: 'Monthly P&L statements formatted for board presentations. No engineering jargon. Just revenue, cost, margin, and ROI.' },
      { title: 'Kill Unprofitable Agents', desc: 'Identify agents with negative ROI and make data-driven decisions to cut, restructure, or double down.' },
    ],
    cta: 'See your agent ROI — free for 2 agents',
  },

  '/vs/datadog': {
    title: 'layeroi vs Datadog for AI Agent Costs',
    headline: 'Datadog monitors infrastructure.',
    subheadline: 'layeroi monitors profitability.',
    description: 'Datadog is the gold standard for infrastructure observability. But it was built for engineers debugging latency and errors — not for CFOs tracking AI agent ROI. layeroi fills the gap Datadog leaves: financial visibility into which agents are worth their cost.',
    comparison: [
      { feature: 'Per-agent P&L statement', layeroi: true, other: false },
      { feature: 'ROI calculation', layeroi: true, other: false },
      { feature: 'CFO-readable dashboard', layeroi: true, other: false },
      { feature: 'Runaway loop kill switch', layeroi: true, other: false },
      { feature: 'Budget envelopes', layeroi: true, other: false },
      { feature: 'Token-level tracking', layeroi: true, other: true },
      { feature: 'Latency monitoring', layeroi: false, other: true },
      { feature: 'Infrastructure APM', layeroi: false, other: true },
      { feature: 'Log management', layeroi: false, other: true },
      { feature: 'Multi-provider LLM support', layeroi: true, other: true },
    ],
    otherName: 'Datadog',
    verdict: 'Use both. Datadog for infrastructure. layeroi for AI economics. They solve different problems for different stakeholders.',
    cta: 'Try layeroi free — complements your Datadog setup',
  },

  '/vs/helicone': {
    title: 'layeroi vs Helicone for AI Cost Tracking',
    headline: 'Helicone logs API calls.',
    subheadline: 'layeroi shows profit & loss.',
    description: 'Helicone is excellent for logging and debugging LLM API calls. layeroi goes further: it calculates per-agent profitability, generates CFO-ready reports, and automatically detects and kills runaway cost loops.',
    comparison: [
      { feature: 'Per-agent P&L statement', layeroi: true, other: false },
      { feature: 'ROI calculation', layeroi: true, other: false },
      { feature: 'Board-ready financial reports', layeroi: true, other: false },
      { feature: 'Runaway loop kill switch', layeroi: true, other: false },
      { feature: 'Budget caps with throttling', layeroi: true, other: false },
      { feature: 'Business value attribution', layeroi: true, other: false },
      { feature: 'Token cost tracking', layeroi: true, other: true },
      { feature: 'Prompt/completion logging', layeroi: false, other: true },
      { feature: 'Request caching', layeroi: false, other: true },
      { feature: 'Custom properties/tags', layeroi: true, other: true },
    ],
    otherName: 'Helicone',
    verdict: 'Helicone is great for engineering debugging. layeroi is built for financial decisions. If your CFO needs to justify AI spend to the board, layeroi is the answer.',
    cta: 'Switch to financial-grade tracking — free for 2 agents',
  },
};

export default function SEOPages({ path }) {
  const page = PAGES[path];
  if (!page) return <div className="landing-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Page not found</p></div>;

  return (
    <div className="landing-root" style={{ minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '64px', background: 'rgba(5,5,5,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div className="l-container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#22c55e"/><rect x="5" y="7" width="3" height="11" rx="1" fill="white"/><rect x="10.5" y="10" width="3" height="8" rx="1" fill="white" opacity="0.75"/><rect x="16" y="5" width="3" height="13" rx="1" fill="white" opacity="0.9"/></svg>
            <span style={{ fontWeight: 600, fontSize: '15px', color: 'white' }}>layer<span style={{ color: '#22c55e' }}>oi</span></span>
          </a>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a href="/login" style={{ color: 'var(--white-70)', textDecoration: 'none', fontSize: '13px' }}>Sign in</a>
            <a href="/signup" className="btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>Start free →</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: '140px', paddingBottom: '80px', position: 'relative', overflow: 'hidden' }} className="grid-bg">
        <div style={{ position: 'absolute', top: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="l-container" style={{ position: 'relative', maxWidth: '780px' }}>
          <h1 className="serif" style={{ fontSize: 'var(--type-display)', color: 'white', lineHeight: 1.1, marginBottom: '12px' }}>
            {page.headline}<br/>
            <span style={{ color: 'var(--white-35)' }}>{page.subheadline}</span>
          </h1>
          <p style={{ fontSize: 'var(--type-body-lg)', color: 'var(--white-50)', lineHeight: 1.6, marginBottom: '40px', maxWidth: '620px' }}>
            {page.description}
          </p>
          <a href="/signup" className="btn-primary" style={{ padding: '14px 28px', fontSize: '15px' }}>{page.cta}</a>
        </div>
      </section>

      {/* Stats */}
      {page.stats && (
        <section style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="l-container">
            <div className="stats-grid">
              {page.stats.map((s, i) => (
                <div key={i} style={{ background: 'var(--surface-0)', padding: '36px 24px', textAlign: 'center' }}>
                  <div className="mono" style={{ fontSize: '36px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>{s.value}</div>
                  <div style={{ fontSize: '13px', color: 'var(--white-50)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      {page.features && (
        <section style={{ padding: '96px 0' }}>
          <div className="l-container">
            <div className="features-grid">
              {page.features.map(f => (
                <div key={f.title} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '28px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '10px' }}>{f.title}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--white-50)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Comparison Table (for /vs/ pages) */}
      {page.comparison && (
        <section style={{ padding: '96px 0' }}>
          <div className="l-container" style={{ maxWidth: '780px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '32px', textAlign: 'center' }}>
              Feature Comparison
            </h2>
            <div style={{ borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '13px', color: 'var(--white-70)' }}>Feature</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#22c55e' }}>layeroi</th>
                    <th style={{ textAlign: 'center', padding: '14px 16px', fontSize: '13px', color: 'var(--white-50)' }}>{page.otherName}</th>
                  </tr>
                </thead>
                <tbody>
                  {page.comparison.map((row, i) => (
                    <tr key={row.feature} style={{ borderBottom: i < page.comparison.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: i % 2 === 0 ? 'var(--surface-0)' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--white-70)' }}>{row.feature}</td>
                      <td style={{ textAlign: 'center', padding: '12px 16px', color: row.layeroi ? '#22c55e' : 'var(--white-20)', fontWeight: 700 }}>{row.layeroi ? '✓' : '—'}</td>
                      <td style={{ textAlign: 'center', padding: '12px 16px', color: row.other ? 'var(--white-70)' : 'var(--white-20)', fontWeight: row.other ? 500 : 400 }}>{row.other ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '15px', color: 'var(--white-70)', lineHeight: 1.6, marginTop: '32px', padding: '20px', background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px' }}>
              <strong style={{ color: 'white' }}>Our verdict:</strong> {page.verdict}
            </p>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ padding: '96px 0', textAlign: 'center', position: 'relative' }} className="grid-bg">
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div className="l-container" style={{ position: 'relative' }}>
          <h2 className="serif" style={{ fontSize: 'var(--type-h1)', color: 'white', lineHeight: 1.1, marginBottom: '20px' }}>
            Ready to see your agent P&L?
          </h2>
          <p style={{ fontSize: 'var(--type-body-lg)', color: 'var(--white-50)', marginBottom: '32px' }}>
            Free for 2 agents. Live in 15 minutes. No credit card.
          </p>
          <a href="/signup" className="btn-primary" style={{ padding: '14px 28px', fontSize: '15px' }}>Start free →</a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '32px 0' }}>
        <div className="l-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--white-35)' }}>© 2026 layeroi</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="/" style={{ fontSize: '13px', color: 'var(--white-50)', textDecoration: 'none' }}>Home</a>
            <a href="/docs" style={{ fontSize: '13px', color: 'var(--white-50)', textDecoration: 'none' }}>Docs</a>
            <a href="/blog" style={{ fontSize: '13px', color: 'var(--white-50)', textDecoration: 'none' }}>Blog</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
