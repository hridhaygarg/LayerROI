import { useState, useEffect } from 'react';
import '../styles/designSystem.css';
import { ThemeToggle } from '../components/ThemeToggle';

export default function Landing() {
  return (
    <div className="landing-root">
      <Navigation />
      <Hero />
      <LogoBar />
      <StatsBar />
      <Problem />
      <HowItWorks />
      <Features />
      <ComparisonTable />
      <ROICalculator />
      <Testimonials />
      <Pricing />
      <FAQ />
      <ClosingCTA />
      <Footer />
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION 1 — NAVIGATION
   ───────────────────────────────────────────── */

function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '64px',
        background: scrolled ? 'var(--surface-0)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        transition: 'all 300ms var(--ease-smooth)',
      }}>
        <div className="l-container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="5" fill="#22c55e"/>
              <rect x="5" y="7" width="3" height="11" rx="1" fill="white"/>
              <rect x="10.5" y="10" width="3" height="8" rx="1" fill="white" opacity="0.75"/>
              <rect x="16" y="5" width="3" height="13" rx="1" fill="white" opacity="0.9"/>
            </svg>
            <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--white)', letterSpacing: '-0.01em' }}>
              layer<span style={{ color: 'var(--green)' }}>oi</span>
            </span>
          </a>

          <div className="nav-middle" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {[
              { label: 'Product', href: '#product' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Docs', href: '/docs' },
              { label: 'Blog', href: '/blog' },
            ].map(item => (
              <a key={item.label} href={item.href} style={{
                color: 'var(--white-50)', textDecoration: 'none', fontSize: '13px', fontWeight: 500,
                transition: 'color 150ms ease',
              }} onMouseEnter={e => e.currentTarget.style.color = 'white'}
                 onMouseLeave={e => e.currentTarget.style.color = 'var(--white-50)'}>
                {item.label}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="/login" className="nav-signin-link" style={{ color: 'var(--white-70)', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
              Sign in
            </a>
            <ThemeToggle compact />
            <a href="/signup" className="btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>
              Start free →
            </a>
            <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-hamburger" style={{
              display: 'none', background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--white)', fontSize: '24px', padding: '8px',
            }}>
              {menuOpen ? '×' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99,
          background: 'rgba(5,5,5,0.96)',
          backdropFilter: 'blur(20px)',
          paddingTop: '80px',
          animation: 'fadeIn 200ms ease',
        }}>
          <div style={{ padding: '32px 24px' }}>
            {[
              { label: 'Product', href: '#product' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Docs', href: '/docs' },
              { label: 'Blog', href: '/blog' },
              { label: 'Sign in', href: '/login' },
            ].map((item, i) => (
              <a key={item.label} href={item.href}
                 onClick={() => setMenuOpen(false)}
                 style={{
                display: 'block', padding: '20px 0',
                fontSize: '24px', color: 'var(--white)',
                fontFamily: 'Instrument Serif', fontStyle: 'italic',
                borderBottom: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                animation: `fadeUp 400ms var(--ease-out) ${i * 60}ms both`,
              }}>
                {item.label}
              </a>
            ))}
            <a href="/signup" onClick={() => setMenuOpen(false)} style={{
              display: 'block', marginTop: '32px',
              background: '#22c55e', color: '#050505',
              padding: '16px', textAlign: 'center',
              borderRadius: '8px', fontSize: '15px',
              fontWeight: 600, textDecoration: 'none',
            }}>
              Start free →
            </a>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .mobile-hamburger { display: block !important; }
          .nav-signin-link { display: none !important; }
        }
      `}</style>
    </>
  );
}

/* ─────────────────────────────────────────────
   SECTION 2 — HERO
   ───────────────────────────────────────────── */

function Hero() {
  return (
    <section style={{
      position: 'relative',
      paddingTop: 'clamp(96px, 16vw, 160px)',
      paddingBottom: 'clamp(64px, 10vw, 96px)',
      overflow: 'hidden',
    }} className="grid-bg">
      <div style={{
        position: 'absolute', top: '-200px', right: '-200px',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      <div className="l-container" style={{ position: 'relative' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(34,197,94,0.06)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: '100px', padding: '5px 14px 5px 10px',
          marginBottom: '32px',
          animation: 'fadeUp 600ms var(--ease-out) both',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 2s infinite' }}/>
          <span className="mono" style={{ fontSize: '11px', color: '#4ade80', letterSpacing: '0.06em', fontWeight: 500 }}>
            NOW IN BETA · FREE FOR 2 AGENTS
          </span>
        </div>

        <h1 className="serif" style={{
          fontSize: 'var(--type-display-lg)',
          color: 'var(--white)', lineHeight: 1.05, maxWidth: '880px',
          animation: 'fadeUp 700ms var(--ease-out) 100ms both',
        }}>
          Every observability tool speaks engineer.
          <br/>
          <span style={{ color: 'var(--white-35)' }}>Only </span>
          <span style={{ color: 'var(--green)' }}>layeroi</span>
          <span style={{ color: 'var(--white-35)' }}> speaks CFO.</span>
        </h1>

        <p style={{
          fontSize: 'var(--type-body-lg)', color: 'var(--white-50)',
          lineHeight: 1.55, maxWidth: '580px', marginTop: '28px',
          animation: 'fadeUp 700ms var(--ease-out) 200ms both',
        }}>
          Know which AI agents make you money — before your CFO asks.
        </p>

        {/* SDK install block */}
        <div style={{
          marginTop: '32px', maxWidth: '540px',
          animation: 'fadeUp 700ms var(--ease-out) 250ms both',
        }}>
          <pre style={{
            background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '16px 20px', fontSize: '13px',
            fontFamily: 'JetBrains Mono, IBM Plex Mono, monospace', color: 'var(--white-70)',
            lineHeight: 1.7, overflowX: 'auto', margin: 0,
          }}>
            <span style={{ color: 'var(--white-35)' }}>$</span> npm install layeroi-sdk{'\n'}
            {'\n'}
            <span style={{ color: '#c084fc' }}>import</span> {'{ layeroi }'} <span style={{ color: '#c084fc' }}>from</span> <span style={{ color: 'var(--green)' }}>'layeroi-sdk'</span>;{'\n'}
            <span style={{ color: '#c084fc' }}>import</span> OpenAI <span style={{ color: '#c084fc' }}>from</span> <span style={{ color: 'var(--green)' }}>'openai'</span>;{'\n'}
            {'\n'}
            layeroi.<span style={{ color: '#60a5fa' }}>init</span>({'{ apiKey: process.env.LAYEROI_API_KEY }'});{'\n'}
            <span style={{ color: '#c084fc' }}>const</span> openai = layeroi.<span style={{ color: '#60a5fa' }}>wrap</span>(<span style={{ color: '#c084fc' }}>new</span> <span style={{ color: '#fbbf24' }}>OpenAI</span>(), {'{ agent: '}<span style={{ color: 'var(--green)' }}>'support-copilot'</span>{' }'});
          </pre>
          <p className="mono" style={{ fontSize: '11px', color: 'var(--white-35)', marginTop: '12px', lineHeight: 1.6 }}>
            Three lines. Every agent call instrumented. CFO-readable reports auto-generated.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '32px', flexWrap: 'wrap',
          animation: 'fadeUp 700ms var(--ease-out) 300ms both' }}
          className="closing-cta-buttons">
          <a href="/signup" className="btn-primary">Start free — no credit card</a>
          <a href="/docs" className="btn-ghost">Read the docs →</a>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          marginTop: '28px', flexWrap: 'wrap',
          animation: 'fadeUp 700ms var(--ease-out) 400ms both',
        }}>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--white-35)', letterSpacing: '0.08em' }}>
            WORKS WITH
          </span>
          <span className="mono" style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600 }}>OpenAI</span>
          <span className="mono" style={{ fontSize: '12px', color: 'var(--white-50)', fontWeight: 500 }}>Anthropic <span style={{ fontSize: '9px', color: 'var(--white-35)', marginLeft: '4px' }}>this week</span></span>
          {['Google Gemini', 'Azure', 'LangChain', 'CrewAI'].map(p => (
            <span key={p} className="mono" style={{ fontSize: '11px', color: 'var(--white-25)', fontWeight: 400 }}>
              {p} <span style={{ fontSize: '9px' }}>soon</span>
            </span>
          ))}
        </div>
      </div>

      <div className="l-container" style={{ marginTop: '80px', animation: 'fadeUp 900ms var(--ease-out) 500ms both' }}>
        <HeroDashboardPreview />
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   HERO DASHBOARD PREVIEW
   ───────────────────────────────────────────── */

function HeroDashboardPreview() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) return <HeroDashboardMobile />;
  return <HeroDashboardDesktop />;
}

function HeroDashboardDesktop() {
  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)',
      border: '1px solid var(--border-default)',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-raised)',
      maxWidth: '1080px',
      margin: '0 auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ff5f57' }}/>
        <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#febc2e' }}/>
        <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#28c840' }}/>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--white-35)' }}>
            layeroi.com/dashboard — live
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 2s infinite' }}/>
          <span className="mono" style={{ fontSize: '10px', color: '#4ade80', letterSpacing: '0.06em' }}>LIVE</span>
        </div>
      </div>

      <div style={{ padding: '28px' }} className="hero-dashboard-grid">
        <div className="hero-sidebar" style={{ borderRight: '1px solid var(--border-subtle)', paddingRight: '20px' }}>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--white-35)', letterSpacing: '0.08em', marginBottom: '14px' }}>
            NAVIGATION
          </div>
          {[
            { label: 'Overview', active: true },
            { label: 'Agents', count: '12' },
            { label: 'Budget' },
            { label: 'Reports' },
            { label: 'Settings' },
          ].map(item => (
            <div key={item.label} style={{
              padding: '8px 10px', borderRadius: '6px', marginBottom: '2px',
              background: item.active ? 'rgba(34,197,94,0.1)' : 'transparent',
              color: item.active ? '#22c55e' : 'var(--white-50)',
              fontSize: '13px', fontWeight: item.active ? 600 : 400,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>{item.label}</span>
              {item.count && <span className="mono" style={{ fontSize: '10px', color: 'var(--white-35)' }}>{item.count}</span>}
            </div>
          ))}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--white)', marginBottom: '2px' }}>This week's performance</h3>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--white-35)' }}>APR 14 — APR 20, 2026</span>
            </div>
            <div className="mono" style={{ fontSize: '10px', color: 'var(--white-35)', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.06em' }}>
              WEEKLY ↓
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }} className="stats-grid">
            {[
              { label: 'TOTAL SPEND', value: '$47,230', change: '+12%', positive: null },
              { label: 'VALUE GENERATED', value: '$214,000', change: '+31%', positive: true },
              { label: 'NET ROI', value: '4.5×', change: '+0.8', positive: true, highlight: true },
              { label: 'WASTED', value: '$11,400', change: '-8%', positive: true, negative: true },
            ].map(s => (
              <div key={s.label} style={{
                background: s.highlight ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${s.highlight ? 'rgba(34,197,94,0.2)' : 'var(--border-subtle)'}`,
                borderRadius: '10px', padding: '14px',
              }}>
                <div className="mono" style={{ fontSize: '9px', color: 'var(--white-35)', letterSpacing: '0.08em', marginBottom: '8px' }}>{s.label}</div>
                <div className="mono" style={{
                  fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em',
                  color: s.negative ? '#ef4444' : s.highlight ? '#22c55e' : 'white',
                  marginBottom: '4px',
                }}>{s.value}</div>
                <div className="mono" style={{ fontSize: '10px', color: s.positive ? '#22c55e' : 'var(--white-35)' }}>{s.change} vs last week</div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px', overflow: 'hidden',
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.8fr 1fr',
              gap: '12px', padding: '10px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              {['AGENT', 'COST', 'VALUE', 'ROI', 'STATUS'].map(h => (
                <span key={h} className="mono" style={{ fontSize: '9px', color: 'var(--white-35)', letterSpacing: '0.08em', fontWeight: 500 }}>{h}</span>
              ))}
            </div>
            {[
              { name: 'sales-outreach-agent', provider: 'gpt-4o', cost: '$12,400', value: '$87,000', roi: '7.0×', color: 'var(--green)', status: 'PROFITABLE' },
              { name: 'support-triage-agent', provider: 'claude-sonnet', cost: '$8,200', value: '$41,000', roi: '5.0×', color: 'var(--green)', status: 'PROFITABLE' },
              { name: 'data-enrichment-agent', provider: 'gpt-4o-mini', cost: '$9,800', value: '$14,700', roi: '1.5×', color: '#f59e0b', status: 'MARGINAL' },
              { name: 'content-generation-v2', provider: 'gpt-4-turbo', cost: '$7,400', value: '$4,440', roi: '0.6×', color: '#ef4444', status: 'LOSING' },
              { name: 'lead-scoring-agent', provider: 'claude-haiku', cost: '$9,430', value: '—', roi: '—', color: 'var(--white-35)', status: 'NO DATA' },
            ].map((a, i) => (
              <div key={a.name} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.8fr 1fr',
                gap: '12px', padding: '12px 16px',
                borderBottom: i === 4 ? 'none' : '1px solid var(--border-subtle)',
                alignItems: 'center',
              }}>
                <div>
                  <div className="mono" style={{ fontSize: '12px', color: 'var(--white-90)', marginBottom: '2px' }}>{a.name}</div>
                  <div className="mono" style={{ fontSize: '10px', color: 'var(--white-35)' }}>{a.provider}</div>
                </div>
                <span className="mono" style={{ fontSize: '12px', color: 'var(--white-70)' }}>{a.cost}</span>
                <span className="mono" style={{ fontSize: '12px', color: 'var(--white-70)' }}>{a.value}</span>
                <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: a.color }}>{a.roi}</span>
                <span className="mono" style={{ fontSize: '10px', color: a.color, letterSpacing: '0.06em', fontWeight: 500 }}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroDashboardMobile() {
  return (
    <div style={{
      background: 'linear-gradient(180deg, #0f0f0f, #0a0a0a)',
      border: '1px solid var(--border-default)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-raised)',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f57' }}/>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#febc2e' }}/>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#28c840' }}/>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 2s infinite' }}/>
          <span className="mono" style={{ fontSize: '9px', color: '#4ade80', letterSpacing: '0.06em' }}>LIVE</span>
        </div>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--white)', marginBottom: '2px' }}>This week</div>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--white-35)' }}>APR 14 — APR 20</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '14px' }}>
          {[
            { label: 'SPEND', value: '$47.2k' },
            { label: 'VALUE', value: '$214k', positive: true },
            { label: 'ROI', value: '4.5×', highlight: true },
            { label: 'WASTED', value: '$11.4k', negative: true },
          ].map(s => (
            <div key={s.label} style={{
              background: s.highlight ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${s.highlight ? 'rgba(34,197,94,0.2)' : 'var(--border-subtle)'}`,
              borderRadius: '8px', padding: '10px',
            }}>
              <div className="mono" style={{ fontSize: '8px', color: 'var(--white-35)', letterSpacing: '0.08em', marginBottom: '4px' }}>{s.label}</div>
              <div className="mono" style={{
                fontSize: '16px', fontWeight: 700,
                color: s.negative ? '#ef4444' : s.highlight ? '#22c55e' : 'white',
                letterSpacing: '-0.02em',
              }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
          {[
            { name: 'sales-outreach', roi: '7.0×', color: 'var(--green)', status: 'PROFIT' },
            { name: 'support-triage', roi: '5.0×', color: 'var(--green)', status: 'PROFIT' },
            { name: 'content-gen-v2', roi: '0.6×', color: '#ef4444', status: 'LOSS' },
          ].map((a, i, arr) => (
            <div key={a.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px',
              borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border-subtle)',
            }}>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--white-90)' }}>{a.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: a.color }}>{a.roi}</span>
                <span className="mono" style={{ fontSize: '8px', color: a.color, background: `${a.color}15`, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.06em' }}>
                  {a.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <span className="mono" style={{ fontSize: '10px', color: 'var(--white-35)' }}>+ 2 more agents</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION 3 — LOGO BAR
   ───────────────────────────────────────────── */

function LogoBar() {
  return (
    <section style={{ padding: '40px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-0)' }}>
      <div className="l-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(20px, 4vw, 48px)', flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--white-35)', letterSpacing: '0.1em' }}>INTEGRATES NATIVELY WITH</span>
          {['OpenAI', 'Anthropic', 'Google', 'Azure', 'LangChain', 'CrewAI', 'Datadog', 'Slack'].map(p => (
            <span key={p} style={{ fontSize: '14px', color: 'var(--white-50)', fontWeight: 500, letterSpacing: '-0.01em' }}>{p}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION 4 — STATS BAR
   ───────────────────────────────────────────── */

function StatsBar() {
  return (
    <section style={{ padding: '96px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="l-container">
        <div className="stats-grid">
          {[
            { big: '47', suffix: '+', label: 'AI agents per enterprise average', mono: 'MARKET SIZE' },
            { big: '40', suffix: '%', label: 'Agentic AI projects cancelled due to unclear ROI', mono: 'GARTNER 2027' },
            { big: '0', suffix: '', label: 'CFOs who can prove their agents are earning their cost', mono: 'UNTIL NOW', negative: true },
            { big: '15', suffix: ' min', label: 'To connect layeroi and see your first live P&L', mono: 'SETUP TIME' },
          ].map((s, i) => (
            <div key={i} className="stat-item" style={{ background: 'var(--surface-0)', padding: '40px 28px', position: 'relative' }}>
              <div className="mono" style={{ fontSize: '10px', color: s.negative ? '#ef4444' : 'var(--white-35)', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: 500 }}>
                {s.mono}
              </div>
              <div className="mono stat-number" style={{
                fontSize: '56px', fontWeight: 700, letterSpacing: '-0.03em',
                color: s.negative ? '#ef4444' : 'white',
                lineHeight: 1, marginBottom: '12px',
                display: 'flex', alignItems: 'baseline',
              }}>
                {s.big}
                <span style={{ fontSize: '32px', color: s.negative ? '#ef4444' : 'var(--white-50)', fontWeight: 500 }}>{s.suffix}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--white-50)', lineHeight: 1.5, maxWidth: '200px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION 5 — THE PROBLEM
   ───────────────────────────────────────────── */

function Problem() {
  return (
    <section style={{ padding: '120px 0' }}>
      <div className="l-container">
        <div className="problem-grid">
          <div className="problem-left" style={{ position: 'sticky', top: '120px', alignSelf: 'start' }}>
            <div className="mono" style={{ fontSize: '11px', color: 'var(--green)', letterSpacing: '0.1em', marginBottom: '20px' }}>01 · THE PROBLEM</div>
            <h2 className="serif" style={{ fontSize: 'var(--type-display)', color: 'var(--white)', lineHeight: 1.1, marginBottom: '24px' }}>
              Your engineers see tokens.<br/>
              <span style={{ color: 'var(--white-35)' }}>Your CFO sees a mystery.</span>
            </h2>
            <p style={{ fontSize: 'var(--type-body-lg)', color: 'var(--white-50)', lineHeight: 1.6 }}>
              Every existing observability tool was built for engineers debugging performance.
              None of them answer the question your board is asking.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ComparisonCard tag="WHAT YOUR ENGINEER SEES" tagColor="var(--white-50)" content={
              <div className="mono" style={{ fontSize: '13px', color: 'var(--white-70)', lineHeight: 2 }}>
                <div>input_tokens: <span style={{ color: 'var(--white)' }}>847,293</span></div>
                <div>output_tokens: <span style={{ color: 'var(--white)' }}>421,194</span></div>
                <div>latency_p99: <span style={{ color: 'var(--white)' }}>243ms</span></div>
                <div>error_rate: <span style={{ color: 'var(--white)' }}>0.3%</span></div>
                <div>api_calls: <span style={{ color: 'var(--white)' }}>47,291</span></div>
              </div>
            }/>
            <ComparisonCard tag="WHAT YOUR CFO HEARS" tagColor="#ef4444" content={
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="serif" style={{ fontSize: '56px', color: '#ef4444', lineHeight: 1 }}>???</div>
                <div style={{ fontSize: '13px', color: 'var(--white-50)', marginTop: '16px' }}>"Which agents are worth the budget?"</div>
              </div>
            }/>
            <ComparisonCard tag="WHAT LAYEROI SHOWS YOUR CFO" tagColor="#22c55e" highlight content={
              <div className="mono" style={{ fontSize: '13px', lineHeight: 2 }}>
                <div>sales_agent: <span style={{ color: 'var(--green)' }}>+$87,000 (7.0× ROI)</span></div>
                <div>support_agent: <span style={{ color: 'var(--green)' }}>+$41,000 (5.0× ROI)</span></div>
                <div>data_enrichment: <span style={{ color: '#f59e0b' }}>+$4,900 (1.5× ROI)</span></div>
                <div>content_gen_v2: <span style={{ color: '#ef4444' }}>-$2,960 (0.6× ROI)</span></div>
                <div style={{ paddingTop: '8px', marginTop: '8px', borderTop: '1px solid var(--border-subtle)', color: 'var(--white-35)' }}>
                  NET: <span style={{ color: 'var(--green)', fontWeight: 700 }}>+$129,940 (4.5×)</span>
                </div>
              </div>
            }/>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonCard({ tag, tagColor, content, highlight }) {
  return (
    <div style={{
      background: highlight ? 'rgba(34,197,94,0.03)' : 'var(--surface-1)',
      border: `1px solid ${highlight ? 'rgba(34,197,94,0.2)' : 'var(--border-subtle)'}`,
      borderRadius: '12px', padding: '24px',
      boxShadow: highlight ? 'var(--glow-green)' : 'none',
    }}>
      <div className="mono" style={{ fontSize: '10px', color: tagColor, letterSpacing: '0.1em', marginBottom: '16px', fontWeight: 500 }}>{tag}</div>
      {content}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION 6 — HOW IT WORKS
   ───────────────────────────────────────────── */

function HowItWorks() {
  return (
    <section style={{ padding: '120px 0', background: 'var(--surface-0)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="l-container">
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--green)', letterSpacing: '0.1em', marginBottom: '16px' }}>02 · HOW IT WORKS</div>
          <h2 className="serif" style={{ fontSize: 'var(--type-display)', color: 'var(--white)', lineHeight: 1.1 }}>
            15 minutes from install<br/>
            <span style={{ color: 'var(--white-35)' }}>to your first P&L.</span>
          </h2>
        </div>

        <div className="how-grid">
          <StepCard number="01" title="Point your SDK to layeroi" description="Change one environment variable. No infrastructure changes. Works with any LLM SDK."
            code={`from openai import OpenAI\n\nclient = OpenAI(\n  base_url="https://api.layeroi.com/v1",\n  api_key=OPENAI_KEY,\n  default_headers={\n    "X-layeroi-Key": "lr_live_...",\n    "X-Agent-Name": "sales-agent",\n  }\n)`}
          />
          <StepCard number="02" title="Your agents run normally" description="We sit as a transparent proxy with under 5ms overhead. Automatic failover if we go down."
            visual={<FlowDiagram />}
          />
          <StepCard number="03" title="Watch your P&L fill up" description="First data points appear in seconds. Full dashboard populates within the first day."
            visual={<MiniDashboardVisual />}
          />
        </div>
      </div>
    </section>
  );
}

function StepCard({ number, title, description, code, visual }) {
  return (
    <div style={{
      background: 'var(--surface-1)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px', padding: '28px',
      display: 'flex', flexDirection: 'column',
    }}>
      <div className="mono" style={{ fontSize: '12px', color: 'var(--green)', letterSpacing: '0.08em', marginBottom: '20px', fontWeight: 500 }}>STEP {number}</div>
      <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--white)', marginBottom: '10px', letterSpacing: '-0.01em' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: 'var(--white-50)', lineHeight: 1.5, marginBottom: '24px' }}>{description}</p>
      {code && (
        <div style={{
          background: '#050505', border: '1px solid var(--border-subtle)',
          borderRadius: '8px', padding: '16px',
          fontFamily: 'JetBrains Mono', fontSize: '11.5px',
          color: 'var(--white-70)', lineHeight: 1.7,
          overflow: 'auto', flex: 1,
        }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{code}</pre>
        </div>
      )}
      {visual && <div style={{ flex: 1 }}>{visual}</div>}
    </div>
  );
}

function FlowDiagram() {
  return (
    <svg viewBox="0 0 280 120" fill="none" style={{ width: '100%', maxWidth: '280px', margin: '0 auto', display: 'block' }}>
      <rect x="0" y="30" width="70" height="60" rx="8" fill="#161616" stroke="rgba(255,255,255,0.08)"/>
      <text x="35" y="55" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="JetBrains Mono">Your</text>
      <text x="35" y="70" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="JetBrains Mono">Agent</text>
      <line x1="70" y1="60" x2="105" y2="60" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 4"/>
      <polygon points="103,56 110,60 103,64" fill="#22c55e"/>
      <rect x="105" y="30" width="70" height="60" rx="8" fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.3)"/>
      <text x="140" y="55" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="JetBrains Mono" fontWeight="700">layeroi</text>
      <text x="140" y="70" textAnchor="middle" fill="rgba(34,197,94,0.6)" fontSize="8" fontFamily="JetBrains Mono">&lt;5ms</text>
      <line x1="175" y1="60" x2="210" y2="60" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="4 4"/>
      <polygon points="208,56 215,60 208,64" fill="rgba(255,255,255,0.3)"/>
      <rect x="210" y="30" width="70" height="60" rx="8" fill="#161616" stroke="rgba(255,255,255,0.08)"/>
      <text x="245" y="55" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="JetBrains Mono">LLM</text>
      <text x="245" y="70" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="JetBrains Mono">Provider</text>
      <text x="140" y="112" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontFamily="JetBrains Mono">transparent proxy · zero downtime risk</text>
    </svg>
  );
}

function MiniDashboardVisual() {
  return (
    <div style={{ background: '#050505', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px', marginTop: '0' }}>
      {[
        { name: 'sales-agent', roi: '7.0×', color: 'var(--green)', w: '85%' },
        { name: 'support-agent', roi: '5.0×', color: 'var(--green)', w: '70%' },
        { name: 'content-v2', roi: '0.6×', color: '#ef4444', w: '25%' },
      ].map(a => (
        <div key={a.name} style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span className="mono" style={{ fontSize: '10px', color: 'var(--white-70)' }}>{a.name}</span>
            <span className="mono" style={{ fontSize: '10px', fontWeight: 700, color: a.color }}>{a.roi}</span>
          </div>
          <div style={{ height: '4px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: a.w, background: a.color, borderRadius: '2px' }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION 7 — FEATURES
   ───────────────────────────────────────────── */

function Features() {
  const feats = [
    { icon: <IconZap />, title: 'Kill switch for runaway loops', description: 'An agent entering a recursive loop can burn $4,000 in 90 minutes. layeroi detects abnormal call patterns in real time and blocks execution in under 60 seconds.', stat: 'STOPS IN 60s' },
    { icon: <IconChart />, title: 'P&L per agent, not per API call', description: 'Every agent gets a real-time profit and loss statement. Cost in, value out, ROI multiple. No tokens. No latency graphs. Numbers your CFO already uses.', stat: 'LIVE DASHBOARD' },
    { icon: <IconMail />, title: 'Board-ready weekly report', description: 'Every Monday morning your CFO gets a branded PDF: total spend, agent rankings, wasteful spend flagged, recommendations for the coming week.', stat: 'AUTO-DELIVERED' },
    { icon: <IconTarget />, title: 'Budget envelopes with throttling', description: 'Set a monthly cap per agent. When an agent hits 80% of its budget, automatic throttling kicks in. No nasty surprises at month-end.', stat: 'PROGRAMMATIC CAPS' },
  ];

  return (
    <section id="product" style={{ padding: '120px 0' }}>
      <div className="l-container">
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--green)', letterSpacing: '0.1em', marginBottom: '16px' }}>03 · CAPABILITIES</div>
          <h2 className="serif" style={{ fontSize: 'var(--type-display)', color: 'var(--white)', lineHeight: 1.1 }}>
            Built by people who have<br/>
            <span style={{ color: 'var(--white-35)' }}>watched a $4,000 API bill land.</span>
          </h2>
        </div>

        <div className="features-grid">
          {feats.map(f => (
            <div key={f.title} style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px', padding: '32px',
              transition: 'all 250ms var(--ease-out)',
              cursor: 'default',
            }} onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }} onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ color: 'var(--white-70)' }}>{f.icon}</div>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--green)', letterSpacing: '0.08em', background: 'rgba(34,197,94,0.08)', padding: '4px 10px', borderRadius: '100px', fontWeight: 500 }}>{f.stat}</div>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--white)', marginBottom: '12px', letterSpacing: '-0.01em' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--white-50)', lineHeight: 1.6 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IconZap() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
function IconChart() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function IconMail() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}
function IconTarget() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}

/* ─────────────────────────────────────────────
   COMPARISON TABLE — layeroi vs alternatives
   ───────────────────────────────────────────── */

function ComparisonTable() {
  const features = [
    { name: 'Per-agent P&L statement', layeroi: true, datadog: false, helicone: false, litellm: false },
    { name: 'ROI calculation per agent', layeroi: true, datadog: false, helicone: false, litellm: false },
    { name: 'CFO-readable dashboard', layeroi: true, datadog: false, helicone: false, litellm: false },
    { name: 'Runaway loop kill switch', layeroi: true, datadog: false, helicone: false, litellm: false },
    { name: 'Budget envelopes + throttling', layeroi: true, datadog: false, helicone: false, litellm: 'partial' },
    { name: 'Weekly board-ready reports', layeroi: true, datadog: false, helicone: false, litellm: false },
    { name: 'Business value attribution', layeroi: true, datadog: false, helicone: false, litellm: false },
    { name: 'Token-level cost tracking', layeroi: true, datadog: true, helicone: true, litellm: true },
    { name: 'Latency monitoring', layeroi: false, datadog: true, helicone: true, litellm: true },
    { name: 'Prompt/completion logging', layeroi: false, datadog: true, helicone: true, litellm: true },
    { name: 'Multi-provider support', layeroi: true, datadog: true, helicone: true, litellm: true },
    { name: '<5ms proxy overhead', layeroi: true, datadog: 'n/a', helicone: true, litellm: true },
  ];

  const renderCell = (val) => {
    if (val === true) return <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span>;
    if (val === false) return <span style={{ color: 'var(--white-20)' }}>—</span>;
    if (val === 'partial') return <span style={{ color: '#f59e0b' }}>~</span>;
    return <span style={{ color: 'var(--white-35)', fontSize: '10px' }}>{val}</span>;
  };

  return (
    <section style={{ padding: '120px 0', background: 'var(--surface-0)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="l-container">
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--green)', letterSpacing: '0.1em', marginBottom: '16px' }}>04 · HOW WE COMPARE</div>
          <h2 className="serif" style={{ fontSize: 'var(--type-display)', color: 'var(--white)', lineHeight: 1.1 }}>
            Other tools monitor infrastructure.<br/>
            <span style={{ color: 'var(--white-35)' }}>layeroi shows financial impact.</span>
          </h2>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
                <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--white-90)' }}>Feature</th>
                <th style={{ textAlign: 'center', padding: '14px 16px', minWidth: '90px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)' }}>layeroi</span>
                </th>
                <th className="mono" style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', color: 'var(--white-50)', minWidth: '80px' }}>Datadog</th>
                <th className="mono" style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', color: 'var(--white-50)', minWidth: '80px' }}>Helicone</th>
                <th className="mono" style={{ textAlign: 'center', padding: '14px 16px', fontSize: '11px', color: 'var(--white-50)', minWidth: '80px' }}>LiteLLM</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={f.name} style={{ borderBottom: i < features.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: i % 2 === 0 ? 'var(--surface-0)' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--white-70)' }}>{f.name}</td>
                  <td style={{ textAlign: 'center', padding: '12px 16px' }}>{renderCell(f.layeroi)}</td>
                  <td style={{ textAlign: 'center', padding: '12px 16px' }}>{renderCell(f.datadog)}</td>
                  <td style={{ textAlign: 'center', padding: '12px 16px' }}>{renderCell(f.helicone)}</td>
                  <td style={{ textAlign: 'center', padding: '12px 16px' }}>{renderCell(f.litellm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <span className="mono" style={{ fontSize: '10px', color: 'var(--white-35)' }}>layeroi is the only tool purpose-built for financial visibility, not engineering observability.</span>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   ROI CALCULATOR — Interactive data section
   ───────────────────────────────────────────── */

function ROICalculator() {
  const [agents, setAgents] = useState(12);
  const [spend, setSpend] = useState(85000);

  const wastedPct = 0.23;
  const wasted = Math.round(spend * wastedPct);
  const annual = wasted * 12;
  const plan = agents <= 5 ? 499 : agents <= 30 ? 2500 : 8500;
  const payback = Math.max(1, Math.ceil(plan / (wasted / 30)));
  const netSavings = annual - plan * 12;

  return (
    <section style={{ padding: '120px 0', background: 'var(--surface-0)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="l-container">
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--green)', letterSpacing: '0.1em', marginBottom: '16px' }}>04 · ROI CALCULATOR</div>
          <h2 className="serif" style={{ fontSize: 'var(--type-display)', color: 'var(--white)', lineHeight: 1.1 }}>
            Calculate what you're losing<br/>
            <span style={{ color: 'var(--white-35)' }}>without visibility.</span>
          </h2>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }} className="features-grid">
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '28px' }}>
              <label className="mono" style={{ fontSize: '10px', color: 'var(--white-35)', letterSpacing: '0.1em', display: 'block', marginBottom: '16px' }}>NUMBER OF AI AGENTS</label>
              <input type="range" min="1" max="100" value={agents} onChange={e => setAgents(+e.target.value)}
                style={{ width: '100%', height: '4px', background: 'var(--surface-3)', borderRadius: '2px', outline: 'none', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--white-35)' }}>1</span>
                <span className="mono" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--white)' }}>{agents}</span>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--white-35)' }}>100</span>
              </div>
            </div>
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '28px' }}>
              <label className="mono" style={{ fontSize: '10px', color: 'var(--white-35)', letterSpacing: '0.1em', display: 'block', marginBottom: '16px' }}>MONTHLY LLM SPEND ($)</label>
              <input type="range" min="5000" max="500000" step="5000" value={spend} onChange={e => setSpend(+e.target.value)}
                style={{ width: '100%', height: '4px', background: 'var(--surface-3)', borderRadius: '2px', outline: 'none', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--white-35)' }}>$5K</span>
                <span className="mono" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--white)' }}>${(spend / 1000).toFixed(0)}K</span>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--white-35)' }}>$500K</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }} className="stats-grid" >
            {[
              { label: 'MONTHLY WASTE', value: `$${(wasted/1000).toFixed(1)}K`, sub: `${(wastedPct*100).toFixed(0)}% of spend`, color: '#ef4444', bg: 'var(--negative-soft)' },
              { label: 'ANNUAL SAVINGS', value: `$${(annual/1000).toFixed(0)}K`, sub: 'recovered with layeroi', color: 'var(--green)', bg: 'var(--green-soft)' },
              { label: 'LAYEROI COST', value: `$${plan.toLocaleString()}`, sub: `/month · ${agents <= 5 ? 'Starter' : agents <= 30 ? 'Business' : 'Enterprise'}`, color: 'var(--white)', bg: 'rgba(255,255,255,0.02)' },
              { label: 'PAYBACK PERIOD', value: `${payback} days`, sub: `net savings: $${(netSavings/1000).toFixed(0)}K/yr`, color: 'var(--green)', bg: 'var(--green-soft)' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '20px' }}>
                <div className="mono" style={{ fontSize: '9px', color: 'var(--white-35)', letterSpacing: '0.08em', marginBottom: '10px' }}>{s.label}</div>
                <div className="mono" style={{ fontSize: '24px', fontWeight: 700, color: s.color, letterSpacing: '-0.02em', marginBottom: '4px' }}>{s.value}</div>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--white-50)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <a href="/signup" className="btn-primary" style={{ padding: '14px 28px', fontSize: '15px' }}>
              Start saving — free for 2 agents
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   TESTIMONIALS — Social proof with data
   ───────────────────────────────────────────── */

function Testimonials() {
  return (
    <section style={{ padding: '120px 0' }}>
      <div className="l-container">
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--green)', letterSpacing: '0.1em', marginBottom: '16px' }}>05 · WHY IT MATTERS</div>
          <h2 className="serif" style={{ fontSize: 'var(--type-display)', color: 'var(--white)', lineHeight: 1.1 }}>
            The data speaks<br/>
            <span style={{ color: 'var(--white-35)' }}>for itself.</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="how-grid">
          {[
            {
              insight: 'A single agent stuck in a retry loop can burn $4,200 per week. Without per-agent cost tracking, nobody notices until the invoice arrives.',
              metric: '$4,200', metricLabel: 'per week — cost of one undetected loop',
              tag: 'RUNAWAY RISK',
            },
            {
              insight: 'Enterprise teams running 30+ agents have no way to attribute costs to individual agents. The monthly invoice is one number — impossible to optimise.',
              metric: '0', metricLabel: 'CFOs who can prove agent ROI today',
              tag: 'VISIBILITY GAP',
            },
            {
              insight: 'When teams add per-agent tracking, they consistently find 20–30% of spend going to agents with negative ROI — agents that cost more than they produce.',
              metric: '23%', metricLabel: 'average waste discovered with visibility',
              tag: 'INDUSTRY DATA',
            },
          ].map(t => (
            <div key={t.tag} style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px', padding: '28px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div>
                <div className="mono" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--green)', marginBottom: '4px' }}>{t.metric}</div>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--white-35)', letterSpacing: '0.06em', marginBottom: '20px' }}>{t.metricLabel}</div>
                <p style={{ fontSize: '14px', color: 'var(--white-70)', lineHeight: 1.6, marginBottom: '24px' }}>{t.insight}</p>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--green)', letterSpacing: '0.08em', fontWeight: 500 }}>{t.tag}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '48px', background: 'var(--surface-1)', border: '1px solid var(--border-subtle)',
          borderRadius: '12px', padding: '32px',
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px',
        }} className="stats-grid">
          {[
            { value: '200+', label: 'Teams in beta' },
            { value: '<5ms', label: 'Proxy overhead' },
            { value: '99.97%', label: 'Uptime SLA' },
            { value: '23%', label: 'Avg waste found' },
            { value: '11 days', label: 'Avg payback period' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '16px' }}>
              <div className="mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--white)', marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--white-50)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION 8 — PRICING
   ───────────────────────────────────────────── */

function Pricing() {
  const plans = [
    {
      name: 'Starter', price: '$499', period: '/month', limit: 'Up to 5 agents',
      features: ['Real-time P&L dashboard', '90 days history', 'Weekly CFO report', 'Email alerts', 'Kill switch protection'],
      cta: 'Start Starter',
    },
    {
      name: 'Business', price: '$2,500', period: '/month', limit: 'Up to 30 agents',
      highlighted: true,
      features: ['Everything in Starter', '1 year history', 'AI-powered insights', 'Spend forecasting', 'ROI benchmarks', 'Slack + webhooks', 'Audit logs', 'Priority support'],
      cta: 'Start Business',
    },
    {
      name: 'Enterprise', price: '$8,500', period: '/month', limit: 'Unlimited agents',
      features: ['Everything in Business', '3 years history', 'SSO and SAML', '99.99% SLA guarantee', 'Dedicated Slack channel', 'Data residency (US/EU)', 'Custom integrations', 'Quarterly business reviews'],
      cta: 'Start Enterprise',
    },
  ];

  return (
    <section id="pricing" style={{ padding: '120px 0', background: 'var(--surface-0)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="l-container">
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="mono" style={{ fontSize: '11px', color: 'var(--green)', letterSpacing: '0.1em', marginBottom: '16px' }}>06 · PRICING</div>
          <h2 className="serif" style={{ fontSize: 'var(--type-display)', color: 'var(--white)', lineHeight: 1.1 }}>
            Priced so it pays for itself<br/>
            <span style={{ color: 'var(--white-35)' }}>before the first invoice.</span>
          </h2>
        </div>

        <div className="pricing-grid">
          {plans.map(p => (
            <div key={p.name} className={p.highlighted ? 'pricing-card-business' : ''} style={{
              background: p.highlighted ? 'linear-gradient(180deg, rgba(34,197,94,0.04) 0%, var(--surface-1) 100%)' : 'var(--surface-1)',
              border: `1px solid ${p.highlighted ? 'rgba(34,197,94,0.3)' : 'var(--border-subtle)'}`,
              borderRadius: '12px', padding: '32px',
              position: 'relative',
              boxShadow: p.highlighted ? 'var(--glow-green)' : 'none',
            }}>
              {p.highlighted && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: '#22c55e', color: '#050505',
                  fontSize: '10px', fontWeight: 700, fontFamily: 'JetBrains Mono',
                  padding: '4px 12px', borderRadius: '100px', letterSpacing: '0.08em',
                }}>MOST POPULAR</div>
              )}
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--white)', marginBottom: '8px' }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '4px' }}>
                <span className="mono" style={{ fontSize: '40px', fontWeight: 700, color: 'var(--white)', letterSpacing: '-0.03em' }}>{p.price}</span>
                <span style={{ fontSize: '14px', color: 'var(--white-50)', marginLeft: '4px' }}>{p.period}</span>
              </div>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--green)', letterSpacing: '0.06em', marginBottom: '24px', fontWeight: 500 }}>{p.limit}</div>
              <ul style={{ listStyle: 'none', marginBottom: '28px' }}>
                {p.features.map(f => (
                  <li key={f} style={{ fontSize: '13.5px', color: 'var(--white-70)', padding: '6px 0', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--green)', flexShrink: 0, marginTop: '2px' }}>→</span>{f}
                  </li>
                ))}
              </ul>
              <a href="/signup" style={{
                display: 'block', width: '100%', textAlign: 'center',
                background: p.highlighted ? '#22c55e' : 'transparent',
                color: p.highlighted ? '#050505' : 'white',
                border: p.highlighted ? 'none' : '1px solid var(--border-strong)',
                padding: '12px', borderRadius: '8px',
                fontSize: '14px', fontWeight: 600, textDecoration: 'none',
                cursor: 'pointer', letterSpacing: '-0.01em',
                transition: 'all 150ms var(--ease-smooth)',
              }}>{p.cta} →</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION 9 — FAQ
   ───────────────────────────────────────────── */

function FAQ() {
  const items = [
    { q: 'Does layeroi add latency to my API calls?', a: 'Under 5ms of proxy overhead in production. Measured across millions of calls. We deploy in the same AWS regions as OpenAI and Anthropic to minimise network hops. If our proxy is unreachable for any reason, your agents fall through to the provider directly — zero downtime risk.' },
    { q: 'Is my prompt data stored anywhere?', a: 'Never. We log four pieces of metadata per call: agent name, model used, token counts, timestamp. The actual content of your prompts and completions never touches our servers. Full details in our data processing addendum, available on request.' },
    { q: 'How long does integration actually take?', a: 'Fifteen minutes. Your engineer changes one environment variable — the base URL of your LLM SDK. No infrastructure changes. No new code paths. No redeployment required for most setups.' },
    { q: 'What compliance certifications do you have?', a: 'SOC 2 Type II audit is currently in progress with Vanta, targeting completion in Q2. GDPR compliance documentation, a data processing agreement, and security questionnaire responses are available immediately on request. Enterprise customers get contractual commitments on data handling.' },
    { q: 'Which LLM providers do you support?', a: 'OpenAI (all GPT and o-series models), Anthropic (all Claude models), Google (Gemini 1.5 and 2.0), Azure OpenAI, and any OpenAI-compatible endpoint. Custom provider support available on Enterprise plans.' },
    { q: 'Can I sign up for Enterprise without talking to sales?', a: 'Yes. Every plan including Enterprise is fully self-serve. Sign up, enter your card, and you are live in 15 minutes. No sales calls, no procurement process, no waiting. SSO, data residency, and SLA guarantees activate automatically on the Enterprise tier.' },
    { q: 'How does billing work?', a: 'Monthly billing via Stripe. You can upgrade, downgrade, or cancel at any time from your dashboard. Annual plans are available at a 20% discount. Enterprise customers can optionally request invoicing with NET-30 terms.' },
  ];

  return (
    <section style={{ padding: '120px 0' }}>
      <div className="l-container-narrow">
        <div className="mono" style={{ fontSize: '11px', color: 'var(--green)', letterSpacing: '0.1em', marginBottom: '16px' }}>07 · QUESTIONS</div>
        <h2 className="serif" style={{ fontSize: 'var(--type-display)', color: 'var(--white)', lineHeight: 1.1, marginBottom: '48px' }}>
          Things we get asked,<br/>
          <span style={{ color: 'var(--white-35)' }}>answered directly.</span>
        </h2>
        {items.map((item, i) => <FAQItem key={i} {...item} />)}
      </div>
    </section>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '24px 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px',
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{ fontSize: '17px', fontWeight: 500, color: 'var(--white)', letterSpacing: '-0.01em' }}>{q}</span>
        <span className="mono" style={{
          fontSize: '18px', color: open ? '#22c55e' : 'var(--white-35)',
          transition: 'transform 300ms var(--ease-spring)',
          transform: open ? 'rotate(45deg)' : 'rotate(0)',
          flexShrink: 0,
        }}>+</span>
      </button>
      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 350ms var(--ease-out)',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontSize: '15px', color: 'var(--white-70)', lineHeight: 1.65, paddingBottom: '24px', maxWidth: '640px' }}>{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION 10 — CLOSING CTA
   ───────────────────────────────────────────── */

function ClosingCTA() {
  return (
    <section style={{ padding: 'clamp(80px, 12vw, 140px) 0', position: 'relative', overflow: 'hidden' }} className="grid-bg">
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '800px', height: '800px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
      }}/>
      <div className="l-container-narrow" style={{ textAlign: 'center', position: 'relative' }}>
        <h2 className="serif" style={{ fontSize: 'var(--type-display-lg)', color: 'var(--white)', lineHeight: 1.05, marginBottom: '24px' }}>
          Your AI agents are<br/>spending money.<br/>
          <span style={{ color: 'var(--green)' }}>Know what they're earning.</span>
        </h2>
        <p style={{ fontSize: 'var(--type-body-lg)', color: 'var(--white-50)', marginBottom: '40px', maxWidth: '520px', margin: '0 auto 40px' }}>
          Free for up to 2 agents. 15 minutes to connect. See your first P&L before your next standup.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }} className="closing-cta-buttons">
          <a href="/signup" className="btn-primary" style={{ padding: '14px 28px', fontSize: '15px' }}>Start free — no credit card</a>
          <a href="#pricing" className="btn-ghost" style={{ padding: '14px 24px', fontSize: '15px' }}>View pricing →</a>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION 11 — FOOTER
   ───────────────────────────────────────────── */

function Footer() {
  return (
    <footer style={{ padding: '80px 0 40px', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="l-container">
        <div className="footer-grid" style={{ marginBottom: '64px' }}>
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="5" fill="#22c55e"/>
                <rect x="5" y="7" width="3" height="11" rx="1" fill="white"/>
                <rect x="10.5" y="10" width="3" height="8" rx="1" fill="white" opacity="0.75"/>
                <rect x="16" y="5" width="3" height="13" rx="1" fill="white" opacity="0.9"/>
              </svg>
              <span style={{ fontWeight: 600, color: 'var(--white)' }}>layer<span style={{ color: 'var(--green)' }}>oi</span></span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--white-50)', lineHeight: 1.6, maxWidth: '280px' }}>
              The financial control layer for AI agents. Built for the CFO.
            </p>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Docs', 'Changelog', 'Status'] },
            { title: 'Integrations', links: ['OpenAI', 'Anthropic', 'LangChain', 'Datadog', 'All →'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Security', 'Contact'] },
            { title: 'Legal', links: ['Terms', 'Privacy', 'DPA', 'Cookies'] },
          ].map(col => (
            <div key={col.title}>
              <div className="mono" style={{ fontSize: '10px', color: 'var(--white-35)', letterSpacing: '0.1em', marginBottom: '16px' }}>{col.title.toUpperCase()}</div>
              {col.links.map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: '13px', color: 'var(--white-70)', padding: '4px 0', textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--white-70)'}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '32px', borderTop: '1px solid var(--border-subtle)' }}>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--white-35)', letterSpacing: '0.06em' }}>
            © 2026 layeroi · hello@layeroi.com
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 2s infinite' }}/>
            <span className="mono" style={{ fontSize: '11px', color: 'var(--white-50)' }}>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
