import { useState, useEffect, useRef } from 'react';

const colors = {
  bg: '#080808',
  card: '#141414',
  elevated: '#1a1a1a',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  borderBright: 'rgba(255,255,255,0.18)',
  textPrimary: '#e8e6e1',
  textSecondary: 'rgba(232,230,225,0.55)',
  textTertiary: 'rgba(232,230,225,0.28)',
  accentGreen: '#c8f264',
  accentGreenDim: 'rgba(200,242,100,0.08)',
  accentGreenBorder: 'rgba(200,242,100,0.2)',
  dangerRed: '#ff4d4d',
  dangerRedDim: 'rgba(255,77,77,0.08)',
  warningAmber: '#f5a623',
  warningAmberDim: 'rgba(245,166,35,0.08)',
};

function useCountUp(target, duration = 1200, trigger = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const increment = target / (duration / 16);
    const interval = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(interval);
  }, [target, duration, trigger]);

  return count;
}

function useInView(ref, threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return isVisible;
}

function FadeUpChild({ children, delay = 0 }) {
  const ref = useRef();
  const isVisible = useInView(ref, 0.1);
  return (
    <div ref={ref} style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)', transition: `all 500ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms` }}>
      {children}
    </div>
  );
}

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const [navBorder, setNavBorder] = useState(false);
  const scrollProgress = (scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setNavBorder(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: colors.bg, color: colors.textPrimary, minHeight: '100vh' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '2px', background: colors.accentGreen, width: `${scrollProgress}%`, zIndex: 1000, transition: 'width 100ms ease' }} />

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', backdropFilter: 'blur(16px)', borderBottom: navBorder ? `1px solid ${colors.border}` : 'none', background: navBorder ? 'rgba(8,8,8,0.7)' : 'transparent', transition: 'all 200ms ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: colors.accentGreen, borderRadius: '50%' }} />
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '14px', fontWeight: '600', letterSpacing: '1px' }}>Layer ROI</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <button style={{ textDecoration: 'none', color: colors.textSecondary, fontSize: '14px', fontFamily: 'DM Mono', background: 'none', border: 'none', cursor: 'pointer' }}>Sign in</button>
          <a href="/signup" style={{ background: colors.accentGreen, color: colors.bg, padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontFamily: 'DM Mono', fontWeight: '600', border: 'none', cursor: 'pointer' }}>Start free</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', position: 'relative' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
          <defs><pattern id="dots" x="32" y="32" patternUnits="userSpaceOnUse"><circle cx="16" cy="16" r="1" fill="rgba(255,255,255,0.03)" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        <div style={{ textAlign: 'center', zIndex: 1, maxWidth: '900px', padding: '0 40px' }}>
          <FadeUpChild delay={0}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: `1px solid ${colors.accentGreenBorder}`, borderRadius: '20px', marginBottom: '32px', background: colors.accentGreenDim }}>
              <div style={{ width: '6px', height: '6px', background: colors.accentGreen, borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: colors.accentGreen, fontWeight: '500' }}>Now in early access</span>
            </div>
          </FadeUpChild>

          <FadeUpChild delay={80}>
            <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '64px', lineHeight: 1.2, marginBottom: '24px', fontWeight: '400' }}>
              Your AI agents are spending money. <span style={{ color: colors.accentGreen, fontStyle: 'italic' }}>Are they worth it?</span>
            </h1>
          </FadeUpChild>

          <FadeUpChild delay={160}>
            <p style={{ fontSize: '18px', color: colors.textSecondary, marginBottom: '48px', lineHeight: 1.6, fontWeight: 300, maxWidth: '700px', margin: '0 auto 48px' }}>
              Layer ROI is the first financial control layer for AI agents — built for CFOs, not engineers. See your agent P&L in 15 minutes.
            </p>
          </FadeUpChild>

          <FadeUpChild delay={240}>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '48px' }}>
              <a href="/signup" style={{ background: colors.accentGreen, color: colors.bg, padding: '16px 32px', borderRadius: '6px', textDecoration: 'none', fontSize: '16px', fontFamily: 'DM Mono', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'all 200ms ease' }} onMouseDown={(e) => (e.target.style.transform = 'scale(0.97)')} onMouseUp={(e) => (e.target.style.transform = 'scale(1)')}>Start for free →</a>
              <button style={{ background: 'transparent', color: colors.textSecondary, padding: '16px 32px', borderRadius: '6px', border: `1px solid ${colors.border}`, cursor: 'pointer', fontSize: '16px', fontFamily: 'DM Mono', fontWeight: '600', transition: 'all 200ms ease' }} onMouseEnter={(e) => { e.target.style.borderColor = colors.borderHover; e.target.style.color = colors.textPrimary; }} onMouseLeave={(e) => { e.target.style.borderColor = colors.border; e.target.style.color = colors.textSecondary; }}>See how it works ↓</button>
            </div>
          </FadeUpChild>

          <FadeUpChild delay={320}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '14px', color: colors.textTertiary, fontFamily: 'DM Mono' }}>
              <span>15-min setup</span><span>·</span><span>No credit card</span><span>·</span><span>Cancel anytime</span>
            </div>
          </FadeUpChild>
        </div>
      </section>

      {/* Stats */}
      <section style={{ borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, padding: '64px 40px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <StatCard number={37} suffix="+" label="Average AI agents per enterprise in 2026" />
        <StatCard number={40} suffix="%" label="Of agentic AI projects cancelled due to unclear ROI" color={colors.dangerRed} />
        <StatCard number={0} suffix="" label="What most CFOs can prove their agents are earning" />
        <StatCard number={15} suffix=" min" label="To connect Layer ROI and see your first P&L" />
      </section>

      {/* Problem */}
      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <FadeUpChild>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <div style={{ fontFamily: 'DM Mono', fontSize: '12px', color: colors.accentGreen, fontWeight: '600', letterSpacing: '2px', marginBottom: '16px' }}>THE PROBLEM</div>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '48px', marginBottom: '24px' }}>Every tool speaks engineer. <span style={{ fontStyle: 'italic' }}>Nobody speaks CFO.</span></h2>
            <p style={{ color: colors.textSecondary, fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>The gap between how your agents spend money and what your board sees is the difference between control and chaos.</p>
          </div>
        </FadeUpChild>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
          <ProblemCard title="Invisible Spending" description="CFO gets one invoice, cannot attribute costs to which agents are burning money." />
          <ProblemCard title="Runaway Loops" description="One agent can burn $4,000 in 90 minutes on API calls, undetected until the invoice arrives." />
          <ProblemCard title="No ROI Proof" description="Board asks what they're getting. Engineering says 'it's complicated.' CEO smiles nervously." />
        </div>
      </section>

      {/* Dashboard Mockup */}
      <section style={{ padding: '80px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <FadeUpChild>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <div style={{ fontFamily: 'DM Mono', fontSize: '12px', color: colors.accentGreen, fontWeight: '600', letterSpacing: '2px', marginBottom: '16px' }}>THE PRODUCT</div>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '48px', marginBottom: '24px' }}>Your AI workforce profit & loss</h2>
          </div>
        </FadeUpChild>

        <FadeUpChild delay={100}>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ background: colors.elevated, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ width: '12px', height: '12px', background: '#ff5f56', borderRadius: '50%' }} />
              <div style={{ width: '12px', height: '12px', background: '#ffbd2e', borderRadius: '50%' }} />
              <div style={{ width: '12px', height: '12px', background: '#27c93f', borderRadius: '50%' }} />
              <div style={{ flex: 1, marginLeft: '16px', color: colors.textTertiary, fontSize: '12px', fontFamily: 'DM Mono' }}>dashboard.layeroi.com/overview</div>
            </div>
            <div style={{ padding: '40px' }}>
              <DashboardTable />
            </div>
          </div>
        </FadeUpChild>
      </section>

      {/* CTA Final */}
      <section style={{ padding: '80px 40px', textAlign: 'center', background: colors.card, borderTop: `1px solid ${colors.border}` }}>
        <FadeUpChild>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '48px', marginBottom: '24px' }}>See your agent P&L in 15 minutes</h2>
        </FadeUpChild>
        <FadeUpChild delay={80}>
          <p style={{ color: colors.textSecondary, fontSize: '18px', marginBottom: '48px', fontWeight: 300 }}>Join the early access program and get financial visibility into your AI agents today.</p>
        </FadeUpChild>
        <FadeUpChild delay={160}>
          <div style={{ display: 'flex', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
            <input type="email" placeholder="your@company.com" style={{ flex: 1, padding: '12px 16px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '6px', color: colors.textPrimary, fontFamily: 'DM Mono', fontSize: '14px' }} />
            <button style={{ background: colors.accentGreen, color: colors.bg, padding: '12px 24px', borderRadius: '6px', border: 'none', fontFamily: 'DM Mono', fontWeight: '600', cursor: 'pointer', transition: 'all 200ms ease' }} onMouseDown={(e) => (e.target.style.transform = 'scale(0.97)')} onMouseUp={(e) => (e.target.style.transform = 'scale(1)')}>Start free →</button>
          </div>
        </FadeUpChild>
        <FadeUpChild delay={240}>
          <div style={{ marginTop: '64px', fontSize: '12px', color: colors.textTertiary, fontFamily: 'DM Mono' }}>© 2026 Layer ROI · The financial control layer for AI agents</div>
        </FadeUpChild>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Mono:wght@400;500&family=Inter:wght@300;400&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { scrollBehavior: smooth; font-family: Inter, sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${colors.accentGreen}; border-radius: 2px; }
        ::selection { background: ${colors.accentGreen}; color: ${colors.bg}; }
      `}</style>
    </div>
  );
}

function StatCard({ number, suffix, label, color = colors.accentGreen }) {
  const ref = useRef();
  const isVisible = useInView(ref, 0.1);
  const count = useCountUp(number, 1200, isVisible);
  return (
    <FadeUpChild>
      <div ref={ref} style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '48px', fontWeight: '400', color: color, marginBottom: '8px' }}>
          {count}{suffix}
        </div>
        <div style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: 1.5 }}>{label}</div>
      </div>
    </FadeUpChild>
  );
}

function ProblemCard({ title, description }) {
  return (
    <FadeUpChild>
      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '32px', transition: 'all 200ms ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = colors.borderHover; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = colors.border; }}>
        <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '20px', marginBottom: '12px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: 1.6 }}>{description}</p>
      </div>
    </FadeUpChild>
  );
}

function DashboardTable() {
  const agents = [
    { name: 'Research Agent', cost: 3200, tasks: 1240, value: 12800, roi: '4.0×', status: 'profitable' },
    { name: 'Writing Engine', cost: 2100, tasks: 890, value: 8900, roi: '4.2×', status: 'profitable' },
    { name: 'Content Analyzer', cost: 1800, tasks: 320, value: 1600, roi: '0.9×', status: 'watch' },
    { name: 'Email Outreach', cost: 4200, tasks: 1100, value: 2200, roi: '0.5×', status: 'losing' },
    { name: 'Data Processor', cost: 950, tasks: 2100, value: 500, roi: '0.5×', status: 'losing' },
  ];

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Mono, monospace', fontSize: '13px' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}>
          <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: '500' }}>Agent</th>
          <th style={{ textAlign: 'right', padding: '12px 0', fontWeight: '500' }}>Cost/mo</th>
          <th style={{ textAlign: 'right', padding: '12px 0', fontWeight: '500' }}>Tasks</th>
          <th style={{ textAlign: 'right', padding: '12px 0', fontWeight: '500' }}>Value</th>
          <th style={{ textAlign: 'right', padding: '12px 0', fontWeight: '500' }}>ROI</th>
          <th style={{ textAlign: 'right', padding: '12px 0', fontWeight: '500' }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {agents.map((agent, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${colors.border}` }} onMouseEnter={(e) => (e.currentTarget.style.background = colors.elevated)} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            <td style={{ padding: '16px 0', color: colors.textPrimary }}>{agent.name}</td>
            <td style={{ textAlign: 'right', padding: '16px 0', color: colors.textSecondary }}>${agent.cost.toLocaleString()}</td>
            <td style={{ textAlign: 'right', padding: '16px 0', color: colors.textSecondary }}>{agent.tasks.toLocaleString()}</td>
            <td style={{ textAlign: 'right', padding: '16px 0', color: colors.accentGreen }}>${agent.value.toLocaleString()}</td>
            <td style={{ textAlign: 'right', padding: '16px 0', color: agent.status === 'profitable' ? colors.accentGreen : agent.status === 'watch' ? colors.warningAmber : colors.dangerRed }}>{agent.roi}</td>
            <td style={{ textAlign: 'right', padding: '16px 0' }}>
              <span style={{ padding: '4px 12px', borderRadius: '4px', background: agent.status === 'profitable' ? colors.accentGreenDim : agent.status === 'watch' ? colors.warningAmberDim : colors.dangerRedDim, color: agent.status === 'profitable' ? colors.accentGreen : agent.status === 'watch' ? colors.warningAmber : colors.dangerRed }}>
                {agent.status === 'profitable' ? '✓ Profitable' : agent.status === 'watch' ? '⚠ Watch' : '✗ Losing'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
