import { useState, useRef, useEffect } from 'react';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { useCountUp } from '../hooks/useCountUp';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { AnimatedSection } from '../components/AnimatedSection';
import { useResponsive } from '../hooks/useResponsive';
import '../styles/landing-responsive.css';
import '../styles/micro-interactions.css';

const colors = {
  bgPrimary: '#fafaf9',
  bgSurface: '#ffffff',
  bgSubtle: '#f5f5f4',
  bgProfit: '#f0fdf4',
  bgLoss: '#fef2f2',
  bgWarning: '#fffbeb',
  borderDefault: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.15)',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  accentGreen: '#16a34a',
  accentGreenLight: '#dcfce7',
  accentGreenBorder: '#86efac',
  dangerRed: '#dc2626',
  dangerLight: '#fef2f2',
  dangerBorder: '#fca5a5',
  warningAmber: '#d97706',
  warningLight: '#fffbeb',
  shadowSm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 6px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
  shadowLg: '0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)',
};

export default function Landing() {
  const scrollProgress = useScrollProgress();
  const [navBlurred, setNavBlurred] = useState(false);
  const { isMobile, isTablet } = useResponsive();
  const problemRef = useRef();

  useEffect(() => {
    const handleScroll = () => setNavBlurred(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = () => {
    problemRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const navigateToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div style={{ background: colors.bgPrimary, color: colors.textPrimary, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Scroll Progress Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '3px',
        background: colors.accentGreen,
        width: `${scrollProgress}%`,
        zIndex: 1000,
        transition: 'width 50ms linear'
      }} />

      {/* Navigation */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 999,
        background: colors.bgSurface,
        borderBottom: `1px solid ${colors.borderDefault}`,
        boxShadow: navBlurred ? `0 10px 30px rgba(0,0,0,0.1), ${colors.shadowSm}` : 'none',
        transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
        backdropFilter: navBlurred ? 'blur(12px)' : 'blur(0px)',
        backgroundColor: navBlurred ? 'rgba(255,255,255,0.95)' : colors.bgSurface,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: `0 ${isMobile ? '12px' : isTablet ? '24px' : '40px'}`, height: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 600ms cubic-bezier(0.16,1,0.3,1) both' }}>
            <div style={{ width: '8px', height: '8px', background: colors.accentGreen, borderRadius: '50%' }} />
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: isMobile ? '14px' : '18px', fontWeight: '600', color: colors.textPrimary }}>Layer ROI</span>
          </div>
          <div style={{ display: 'flex', gap: isMobile ? '8px' : '24px', alignItems: 'center', animation: 'fadeIn 600ms cubic-bezier(0.16,1,0.3,1) both 100ms' }}>
            {!isMobile && <button onClick={navigateToDashboard} style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              fontWeight: '500',
              color: colors.textSecondary,
              cursor: 'pointer',
              transition: 'color 200ms cubic-bezier(0.16,1,0.3,1)',
              position: 'relative',
            }} onMouseEnter={(e) => (e.target.style.color = colors.textPrimary)} onMouseLeave={(e) => (e.target.style.color = colors.textSecondary)}>
              Sign in
              <div style={{
                position: 'absolute',
                bottom: '-4px',
                left: '0',
                right: '0',
                height: '2px',
                background: colors.accentGreen,
                opacity: 0,
                transition: 'opacity 200ms cubic-bezier(0.16,1,0.3,1)',
                transform: 'scaleX(0)',
                transformOrigin: 'right',
              }} onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scaleX(1)'; e.currentTarget.style.transformOrigin = 'left'; }} />
            </button>}
            <a href="/signup" style={{
              background: colors.bgSurface,
              border: `1px solid ${colors.accentGreen}`,
              color: colors.accentGreen,
              padding: isMobile ? '6px 12px' : '8px 20px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
              display: 'inline-block',
              position: 'relative',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }} onMouseEnter={(e) => {
              e.target.style.background = colors.accentGreen;
              e.target.style.color = colors.bgSurface;
              e.target.style.transform = 'scale(1.05)';
            }} onMouseLeave={(e) => {
              e.target.style.background = colors.bgSurface;
              e.target.style.color = colors.accentGreen;
              e.target.style.transform = 'scale(1)';
            }}>Start free →</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ background: colors.bgSurface, padding: `${isMobile ? '48px' : isTablet ? '64px' : '96px'} ${isMobile ? '16px' : isTablet ? '24px' : '40px'}`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Mesh Background Glow */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(22,163,74,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-20%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(22,163,74,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <AnimatedSection animation="fadeUp" delay={0}>
            <div style={{ display: 'inline-block', padding: '8px 16px', border: `1px solid ${colors.accentGreenBorder}`, borderRadius: '20px', background: colors.accentGreenLight, marginBottom: '32px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '500', color: colors.accentGreen }}>Financial intelligence for AI teams</span>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fadeUp" delay={80}>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: isMobile ? '32px' : isTablet ? '48px' : '72px', fontWeight: '700', lineHeight: 1.1, marginBottom: '16px', color: colors.textPrimary }}>
              Your AI agents are spending money.<br />
              <span style={{ color: colors.accentGreen, fontStyle: 'italic' }}>Are they earning it?</span>
            </h1>
          </AnimatedSection>

          <AnimatedSection animation="fadeUp" delay={160}>
            <p style={{ fontSize: isMobile ? '14px' : isTablet ? '16px' : '20px', color: colors.textSecondary, marginBottom: '48px', lineHeight: 1.6, maxWidth: '560px', margin: '0 auto 48px' }}>
              Layer ROI is the only financial control layer for AI agents. See your agent P&L in 15 minutes — built for CFOs, not engineers.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fadeUp" delay={240}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '12px' : '16px', justifyContent: 'center', marginBottom: '48px', width: isMobile ? '100%' : 'auto' }}>
              <a href="/signup" style={{
                background: colors.accentGreen,
                color: colors.bgSurface,
                padding: isMobile ? '10px 20px' : '12px 28px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: '500',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                display: 'inline-block',
                position: 'relative',
                textAlign: 'center',
                minWidth: isMobile ? 'auto' : '120px',
              }} onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = `0 12px 20px rgba(22,163,74,0.3)`;
              }} onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }} onMouseDown={(e) => (e.target.style.transform = 'scale(0.98)')} onMouseUp={(e) => (e.target.style.transform = 'translateY(-2px)')}>Start for free →</a>
              <button onClick={scrollToSection} style={{
                background: colors.bgSurface,
                color: colors.textSecondary,
                padding: '12px 28px',
                borderRadius: '6px',
                border: `1px solid ${colors.borderDefault}`,
                fontSize: '16px',
                fontWeight: '500',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                textDecoration: 'none',
                position: 'relative',
              }} onMouseEnter={(e) => {
                e.target.style.color = colors.textPrimary;
                e.target.style.borderColor = colors.textPrimary;
              }} onMouseLeave={(e) => {
                e.target.style.color = colors.textSecondary;
                e.target.style.borderColor = colors.borderDefault;
              }}>See how it works</button>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fadeUp" delay={320}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '14px', color: colors.textTertiary, fontFamily: 'Inter, sans-serif' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: colors.accentGreen, fontSize: '16px' }}>✓</span> Free for 2 agents</span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: colors.accentGreen, fontSize: '16px' }}>✓</span> 15-min setup</span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: colors.accentGreen, fontSize: '16px' }}>✓</span> No credit card</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ background: colors.bgSubtle, borderTop: `1px solid ${colors.borderDefault}`, borderBottom: `1px solid ${colors.borderDefault}`, padding: '64px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px' }}>
          <StatCard number={37} suffix="+" label="Average AI agents per enterprise in 2026" delay={0} />
          <StatCard number={40} suffix="%" label="Of agentic AI projects cancelled due to unclear ROI" color={colors.dangerRed} delay={100} />
          <StatCard number={0} suffix="" label="What most CFOs can prove their agents are earning" delay={200} />
          <StatCard number={15} suffix=" min" label="To connect Layer ROI and see your first P&L" delay={300} />
        </div>
      </section>

      {/* Problem Section */}
      <section ref={problemRef} style={{ background: colors.bgSurface, padding: '96px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <AnimatedSection animation="fadeUp">
            <div style={{ marginBottom: '80px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '600', color: colors.accentGreen, letterSpacing: '2px', textTransform: 'uppercase' }}>The Problem</span>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', fontWeight: '600', marginTop: '16px', marginBottom: '24px', color: colors.textPrimary }}>Every tool speaks engineer.<br /><span style={{ fontStyle: 'italic' }}>Nobody speaks CFO.</span></h2>
              <p style={{ fontSize: '18px', color: colors.textSecondary, maxWidth: '600px' }}>The gap between how your agents spend money and what your board sees is the difference between control and chaos.</p>
            </div>
          </AnimatedSection>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
            <ProblemCard icon="👁️" title="Invisible Spending" description="CFO gets one invoice, cannot attribute costs to which agents are burning money." delay={0} />
            <ProblemCard icon="⚠️" title="Runaway Loops" description="One agent can burn $4,000 in 90 minutes on API calls, undetected until the invoice arrives." delay={100} />
            <ProblemCard icon="❓" title="No ROI Proof" description="Board asks what they're getting. Engineering says 'it's complicated.' CEO smiles nervously." delay={200} />
          </div>
        </div>
      </section>

      {/* Dashboard Mockup */}
      <section style={{ background: colors.bgSubtle, padding: '96px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <AnimatedSection animation="fadeUp">
            <div style={{ marginBottom: '80px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '600', color: colors.accentGreen, letterSpacing: '2px', textTransform: 'uppercase' }}>The Product</span>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', fontWeight: '600', marginTop: '16px', color: colors.textPrimary }}>Your AI workforce profit & loss</h2>
            </div>
          </AnimatedSection>

          <DashboardMockupWithParallax />
        </div>
      </section>

      {/* How It Works */}
      <section style={{ background: colors.bgSurface, padding: '96px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <AnimatedSection animation="fadeUp">
            <div style={{ marginBottom: '80px', textAlign: 'center' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '600', color: colors.accentGreen, letterSpacing: '2px', textTransform: 'uppercase' }}>How It Works</span>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', fontWeight: '600', marginTop: '16px', color: colors.textPrimary }}>Three steps to financial visibility</h2>
            </div>
          </AnimatedSection>

          <HowItWorksSection />
        </div>
      </section>

      {/* Features */}
      <section style={{ background: colors.bgSubtle, padding: '96px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <AnimatedSection animation="fadeUp">
            <div style={{ marginBottom: '80px', textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', fontWeight: '600', color: colors.textPrimary }}>Built for CFOs. Used by engineers.</h2>
            </div>
          </AnimatedSection>

          <FeaturesGrid />
        </div>
      </section>

      {/* ROI Calculator */}
      <section style={{ background: colors.bgPrimary, padding: '96px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <AnimatedSection animation="fadeUp">
            <div style={{ marginBottom: '80px', textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', fontWeight: '600', marginBottom: '16px', color: colors.textPrimary }}>Calculate your AI agent waste</h2>
              <p style={{ fontSize: '18px', color: colors.textSecondary, maxWidth: '600px', margin: '0 auto' }}>See how much your agents are costing you before Layer ROI.</p>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fadeUp" delay={80}>
            <ROICalculator />
          </AnimatedSection>
        </div>
      </section>

      {/* Comparison */}
      <section style={{ background: colors.bgSurface, padding: '96px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <AnimatedSection animation="fadeUp">
            <div style={{ marginBottom: '80px', textAlign: 'center' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '600', color: colors.accentGreen, letterSpacing: '2px', textTransform: 'uppercase' }}>How We Compare</span>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', fontWeight: '600', marginTop: '16px', color: colors.textPrimary }}>Why CFOs choose Layer ROI</h2>
              <p style={{ fontSize: '18px', color: colors.textSecondary, maxWidth: '600px', margin: '24px auto 0' }}>Other tools monitor infrastructure. Layer ROI shows financial impact.</p>
            </div>
          </AnimatedSection>

          <ComparisonTable />
        </div>
      </section>

      {/* Pricing */}
      <section style={{ background: colors.bgSurface, padding: '96px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <AnimatedSection animation="fadeUp">
            <div style={{ marginBottom: '80px', textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', fontWeight: '600', color: colors.textPrimary, marginBottom: '24px' }}>Simple, transparent pricing</h2>
              <p style={{ fontSize: '18px', color: colors.textSecondary, maxWidth: '600px', margin: '0 auto' }}>Start free with 2 agents. Upgrade anytime. No hidden fees.</p>
            </div>
          </AnimatedSection>

          <PricingSection />
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: colors.bgSurface, padding: '96px 40px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <AnimatedSection animation="fadeUp">
            <div style={{ marginBottom: '80px', textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', fontWeight: '600', marginBottom: '16px', color: colors.textPrimary }}>Frequently asked questions</h2>
              <p style={{ fontSize: '18px', color: colors.textSecondary }}>Everything you need to know about Layer ROI.</p>
            </div>
          </AnimatedSection>

          <FAQSection />
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: colors.accentGreen,
        padding: '96px 40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${colors.accentGreen} 0%, #15803d 50%, ${colors.accentGreen} 100%)`,
          backgroundSize: '200% 200%',
          animation: 'gradientShift 6s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <AnimatedSection animation="fadeUp">
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', fontWeight: '600', color: colors.bgSurface, marginBottom: '24px' }}>See your agent ROI in 15 minutes</h2>
          </AnimatedSection>
          <AnimatedSection animation="fadeUp" delay={80}>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', marginBottom: '48px', fontWeight: '300' }}>Join the early access program and get financial visibility into your AI agents today.</p>
          </AnimatedSection>
          <AnimatedSection animation="fadeUp" delay={160}>
            <a href="/signup" style={{
              background: colors.bgSurface,
              color: colors.accentGreen,
              padding: '14px 32px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
              display: 'inline-block',
              position: 'relative',
            }} onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 20px rgba(0,0,0,0.2)';
            }} onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }} onMouseDown={(e) => (e.target.style.transform = 'scale(0.98)')} onMouseUp={(e) => (e.target.style.transform = 'translateY(-2px)')}>Get started free →</a>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: colors.bgSurface, borderTop: `1px solid ${colors.borderDefault}`, padding: '40px' }}>
        <AnimatedSection animation="fadeUp">
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: colors.textTertiary }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', background: colors.accentGreen, borderRadius: '50%' }} />
              <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: '600', color: colors.textPrimary }}>Layer ROI</span>
            </div>
            <span>© 2026 Layer ROI · Financial intelligence for AI teams</span>
          </div>
        </AnimatedSection>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: Inter, sans-serif; background: ${colors.bgPrimary}; color: ${colors.textPrimary}; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${colors.textTertiary}; border-radius: 4px; }
        ::selection { background: ${colors.accentGreenLight}; color: ${colors.accentGreen}; }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(to right, ${colors.accentGreen} 0%, ${colors.accentGreen} var(--value), ${colors.accentGreenLight} var(--value), ${colors.accentGreenLight} 100%);
          height: 6px;
          border-radius: 3px;
          outline: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${colors.accentGreen};
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
          transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
        }

        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${colors.accentGreen};
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
          transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
        }

        input[type="number"] {
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}

function StatCard({ number, suffix, label, color = colors.accentGreen, delay = 0 }) {
  const { ref, hasBeenVisible } = useIntersectionObserver({ threshold: 0.1, once: true });
  const { count, start } = useCountUp(number, 1200, true);

  return (
    <AnimatedSection animation="fadeUp" delay={delay}>
      <div ref={ref} style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', fontWeight: '500', color: colors.textTertiary, textTransform: 'uppercase', marginBottom: '8px' }}>Metric</div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', fontWeight: '700', color: color, marginBottom: '8px' }}>
          {count}{suffix}
        </div>
        <div style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: 1.6 }}>{label}</div>
      </div>
    </AnimatedSection>
  );
}

function ProblemCard({ icon, title, description, delay = 0 }) {
  return (
    <AnimatedSection animation="fadeUp" delay={delay}>
      <div style={{
        background: colors.bgSurface,
        border: `1px solid ${colors.borderDefault}`,
        borderRadius: '12px',
        padding: '24px',
        transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
        cursor: 'pointer',
        boxShadow: colors.shadowSm,
        position: 'relative',
        overflow: 'hidden',
      }} onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = colors.shadowMd;
        e.currentTarget.style.transform = 'translateY(-4px)';
      }} onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = colors.shadowSm;
        e.currentTarget.style.transform = 'translateY(0)';
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: colors.accentGreen,
          transform: 'scaleX(0)',
          transformOrigin: 'left',
          transition: 'transform 300ms cubic-bezier(0.16,1,0.3,1)',
        }} onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scaleX(1)';
        }} />
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
        <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: 1.6 }}>{description}</p>
      </div>
    </AnimatedSection>
  );
}

function DashboardMockupWithParallax() {
  const [parallaxY, setParallaxY] = useState(0);
  const { ref, hasBeenVisible } = useIntersectionObserver({ threshold: 0.3, once: false });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const offsetY = (e.clientY - centerY) * 0.03;
      setParallaxY(offsetY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [ref]);

  return (
    <AnimatedSection animation="fadeUp" delay={100}>
      <div ref={ref} style={{
        background: colors.bgSurface,
        border: `1px solid ${colors.borderDefault}`,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: colors.shadowLg,
        transform: `translateY(${parallaxY}px)`,
        transition: 'transform 100ms ease-out',
      }}>
        <div style={{ background: colors.bgSubtle, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${colors.borderDefault}` }}>
          <div style={{ width: '12px', height: '12px', background: '#ff5f56', borderRadius: '50%' }} />
          <div style={{ width: '12px', height: '12px', background: '#ffbd2e', borderRadius: '50%' }} />
          <div style={{ width: '12px', height: '12px', background: '#27c93f', borderRadius: '50%' }} />
          <div style={{ flex: 1, marginLeft: '16px', color: colors.textTertiary, fontSize: '12px', fontFamily: 'IBM Plex Mono, monospace' }}>dashboard.layeroi.com/overview</div>
        </div>
        <div style={{ padding: '40px' }}>
          <DashboardMockupTable />
        </div>
      </div>
    </AnimatedSection>
  );
}

function HowItWorksSection() {
  const { ref: svgRef, hasBeenVisible } = useIntersectionObserver({ threshold: 0.3, once: true });
  const steps = [
    { number: '01', title: 'Connect Agents', description: 'Copy one line into your agent code. Takes 5 minutes.' },
    { number: '02', title: 'Track Spending', description: 'Layer ROI monitors every API call, models, tokens, and cost in real-time.' },
    { number: '03', title: 'Optimize ROI', description: 'See which agents make money and which burn it. Kill the losers.' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px', position: 'relative' }}>
      {/* SVG Line Connector */}
      <svg ref={svgRef} style={{
        position: 'absolute',
        top: '80px',
        left: '0',
        right: '0',
        height: '4px',
        pointerEvents: 'none',
      }} preserveAspectRatio="none">
        <line x1="0" y1="2" x2="100%" y2="2" stroke={colors.accentGreen} strokeWidth="2" style={{
          opacity: hasBeenVisible ? 1 : 0,
          strokeDasharray: '1000',
          strokeDashoffset: hasBeenVisible ? 0 : 1000,
          transition: 'opacity 600ms cubic-bezier(0.16,1,0.3,1) 200ms, stroke-dashoffset 1000ms cubic-bezier(0.16,1,0.3,1) 200ms',
        }} />
      </svg>

      {steps.map((step, i) => (
        <AnimatedSection key={i} animation="fadeUp" delay={i * 100}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '64px', fontWeight: '700', color: 'rgba(0,0,0,0.03)', marginBottom: '16px' }}>{step.number}</div>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>{step.title}</h3>
            <p style={{ fontSize: '16px', color: colors.textSecondary, lineHeight: 1.6 }}>{step.description}</p>
          </div>
        </AnimatedSection>
      ))}
    </div>
  );
}

function FeaturesGrid() {
  const features = [
    { title: 'Real-time cost attribution', desc: 'Know which agent, which model, which call is costing you money.' },
    { title: 'Runaway loop detection', desc: 'Automatically detect and alert when an agent enters an infinite loop.' },
    { title: 'Agent P&L statements', desc: 'Monthly reports showing revenue attribution and cost per task.', highlight: true },
    { title: 'Budget controls', desc: 'Set spend limits per agent and automatically pause at thresholds.' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
      {features.map((feature, i) => (
        <AnimatedSection key={i} animation={i % 2 === 0 ? 'fadeLeft' : 'fadeRight'} delay={i * 80}>
          <div style={{
            background: feature.highlight ? colors.bgProfit : colors.bgSurface,
            border: `1px solid ${feature.highlight ? colors.accentGreenBorder : colors.borderDefault}`,
            borderRadius: '12px',
            padding: '24px',
            transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
            cursor: 'pointer',
            boxShadow: colors.shadowSm,
            position: 'relative',
          }} onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = colors.shadowMd;
            e.currentTarget.style.transform = 'translateY(-4px)';
          }} onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = colors.shadowSm;
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>{feature.title}</h3>
            <p style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: 1.6 }}>{feature.desc}</p>
          </div>
        </AnimatedSection>
      ))}
    </div>
  );
}

function PricingSection() {
  const cards = [
    { title: 'Starter', price: '$499', period: '/ month', agents: 'Up to 5 agents', features: ['Real-time tracking', 'Basic alerts', 'Monthly reports'] },
    { title: 'Business', price: '$2,500', period: '/ month', agents: 'Up to 30 agents', features: ['Everything in Starter', 'Advanced anomaly detection', 'API access', 'Quarterly reviews'], highlight: true, badge: 'Most popular' },
    { title: 'Enterprise', price: 'Custom', agents: 'Unlimited agents', features: ['Everything in Business', 'Custom integrations', 'Dedicated support', 'Annual planning'], cta: 'Contact us' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
      {cards.map((card, i) => (
        <AnimatedSection key={i} animation="fadeUp" delay={i * 80}>
          <div style={{
            background: card.highlight ? colors.bgProfit : colors.bgSurface,
            border: `1px solid ${card.highlight ? colors.accentGreenBorder : colors.borderDefault}`,
            borderRadius: '12px',
            padding: '32px',
            position: 'relative',
            transform: card.highlight ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
            boxShadow: card.highlight ? colors.shadowMd : colors.shadowSm,
          }}>
            {card.badge && <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: colors.accentGreen,
              color: colors.bgSurface,
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
              animation: 'fadeUp 600ms cubic-bezier(0.16,1,0.3,1) both',
            }}>{card.badge}</div>}
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: colors.textPrimary }}>{card.title}</h3>
            <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '14px', color: colors.textSecondary, marginBottom: '24px' }}>{card.agents}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '32px' }}>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: '700', color: colors.textPrimary }}>{card.price}</span>
              {card.period && <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '14px', color: colors.textSecondary }}>{card.period}</span>}
            </div>
            <ul style={{ marginBottom: '32px', listStyle: 'none' }}>
              {card.features.map((f, j) => (
                <li key={j} style={{
                  fontSize: '14px',
                  color: colors.textSecondary,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  animation: `fadeUp 300ms cubic-bezier(0.16,1,0.3,1) both ${100 + j * 50}ms`,
                }}>
                  <span style={{ color: colors.accentGreen, fontWeight: 'bold' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => window.location.href = '/signup'} style={{
              width: '100%',
              background: card.highlight ? colors.accentGreen : colors.bgSurface,
              color: card.highlight ? colors.bgSurface : colors.accentGreen,
              border: `1px solid ${colors.accentGreen}`,
              padding: '12px 24px',
              borderRadius: '6px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
            }} onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = `0 8px 16px ${card.highlight ? 'rgba(22,163,74,0.2)' : 'rgba(0,0,0,0.1)'}`;
            }} onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }} onMouseDown={(e) => (e.target.style.transform = 'scale(0.98)')} onMouseUp={(e) => (e.target.style.transform = 'translateY(-2px)')}>
              {card.cta || 'Start free'} →
            </button>
          </div>
        </AnimatedSection>
      ))}
    </div>
  );
}

function ComparisonTable() {
  const rows = [
    { tool: 'Layer ROI', buildup: 'CFOs', shows: 'P&L per agent, ROI, cost per task, profitability', cfo: true, highlight: true },
    { tool: 'Datadog', buildup: 'Engineers', shows: 'Tokens, traces, infrastructure logs', cfo: false },
    { tool: 'Helicone', buildup: 'Engineers', shows: 'API logs, token usage, latency', cfo: false },
    { tool: 'LiteLLM', buildup: 'Developers', shows: 'Spend by API key, model costs', cfo: false },
    { tool: 'Bifrost', buildup: 'DevOps', shows: 'Cost by provider, infrastructure metrics', cfo: false },
  ];

  return (
    <AnimatedSection animation="fadeUp" delay={80}>
      <div style={{ overflowX: 'auto', borderRadius: '12px', border: `1px solid ${colors.borderDefault}`, boxShadow: colors.shadowSm }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', backgroundColor: colors.bgSurface }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${colors.borderDefault}`, backgroundColor: colors.bgSubtle }}>
              <th style={{ textAlign: 'left', padding: '20px 24px', fontFamily: 'Playfair Display, serif', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>Tool</th>
              <th style={{ textAlign: 'left', padding: '20px 24px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Built For</th>
              <th style={{ textAlign: 'left', padding: '20px 24px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>What It Shows</th>
              <th style={{ textAlign: 'center', padding: '20px 24px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>CFO-Ready</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{
                borderBottom: `1px solid ${colors.borderDefault}`,
                backgroundColor: row.highlight ? colors.bgProfit : (i % 2 === 0 ? colors.bgSurface : colors.bgSubtle),
                transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                animation: `fadeUp 300ms cubic-bezier(0.16,1,0.3,1) both ${i * 50}ms`,
              }} onMouseEnter={(e) => !row.highlight && (e.currentTarget.style.backgroundColor = colors.bgSubtle)} onMouseLeave={(e) => !row.highlight && (e.currentTarget.style.backgroundColor = i % 2 === 0 ? colors.bgSurface : colors.bgSubtle)}>
                <td style={{ padding: '20px 24px', fontFamily: 'Playfair Display, serif', fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                  {row.tool}
                  {row.highlight && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: '600', color: colors.accentGreen, backgroundColor: colors.accentGreenLight, padding: '4px 10px', borderRadius: '4px', marginLeft: '12px' }}>BEST FOR CFOS</span>}
                </td>
                <td style={{ padding: '20px 24px', color: colors.textSecondary, fontSize: '14px' }}>{row.buildup}</td>
                <td style={{ padding: '20px 24px', color: colors.textSecondary, fontSize: '14px' }}>{row.shows}</td>
                <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-flex',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    backgroundColor: row.cfo ? colors.bgProfit : colors.bgLoss,
                    color: row.cfo ? colors.accentGreen : colors.dangerRed,
                    border: `1px solid ${row.cfo ? colors.accentGreenBorder : colors.dangerBorder}`
                  }}>
                    {row.cfo ? '✓' : '✗'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AnimatedSection>
  );
}

function FAQSection() {
  const faqs = [
    { question: 'Does this add latency?', answer: 'Under 5ms overhead, imperceptible to your users. Layer ROI runs asynchronously and doesn\'t block API calls.' },
    { question: 'Is prompt data stored?', answer: 'No. We only store metadata: cost, tokens used, agent name, and timestamp. Your prompt content never leaves your system.' },
    { question: 'Works with Anthropic too?', answer: 'Yes. OpenAI, Anthropic, and any OpenAI-compatible endpoint. Full cost tracking across all providers.' },
    { question: 'How long is setup?', answer: '15 minutes. Add one environment variable to your code and Layer ROI starts tracking immediately.' },
    { question: 'More than 30 agents?', answer: 'Contact our sales team for Enterprise pricing and custom configurations for unlimited agents.' },
    { question: 'If agent down, affects reliability?', answer: 'No. Layer ROI fallback to direct LLM calls. Your agents are never impacted if our service is unavailable.' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {faqs.map((faq, i) => (
        <FAQItem key={i} question={faq.question} answer={faq.answer} delay={i * 50} />
      ))}
    </div>
  );
}

function FAQItem({ question, answer, delay = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  return (
    <AnimatedSection animation="fadeUp" delay={delay}>
      <div style={{
        background: colors.bgSurface,
        border: `1px solid ${colors.borderDefault}`,
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
        boxShadow: isOpen ? colors.shadowMd : colors.shadowSm,
      }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            color: colors.textPrimary,
            fontFamily: 'Inter, sans-serif',
            transition: 'background-color 200ms cubic-bezier(0.16,1,0.3,1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.bgSubtle)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <span>{question}</span>
          <span style={{
            fontSize: '20px',
            fontWeight: '600',
            color: colors.accentGreen,
            transition: 'transform 300ms cubic-bezier(0.16,1,0.3,1)',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>+</span>
        </button>
        <div style={{
          maxHeight: `${height}px`,
          overflow: 'hidden',
          transition: 'max-height 300ms cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div
            ref={contentRef}
            style={{
              padding: '0 24px 20px 24px',
              color: colors.textSecondary,
              fontSize: '15px',
              lineHeight: 1.6,
              borderTop: `1px solid ${colors.borderDefault}`,
              marginTop: '0',
            }}
          >
            {answer}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

function DashboardMockupTable() {
  const agents = [
    { name: 'Research Agent', cost: 3200, tasks: 1240, value: 12800, roi: '4.0×', status: 'profitable' },
    { name: 'Writing Engine', cost: 2100, tasks: 890, value: 8900, roi: '4.2×', status: 'profitable' },
    { name: 'Content Analyzer', cost: 1800, tasks: 320, value: 1600, roi: '0.9×', status: 'watch' },
    { name: 'Email Outreach', cost: 4200, tasks: 1100, value: 2200, roi: '0.5×', status: 'losing' },
    { name: 'Data Processor', cost: 950, tasks: 2100, value: 500, roi: '0.5×', status: 'losing' },
  ];

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${colors.borderDefault}`, color: colors.textSecondary, fontFamily: 'IBM Plex Mono, monospace' }}>
          <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' }}>Agent</th>
          <th style={{ textAlign: 'right', padding: '12px 0', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' }}>Cost/mo</th>
          <th style={{ textAlign: 'right', padding: '12px 0', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' }}>Tasks</th>
          <th style={{ textAlign: 'right', padding: '12px 0', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' }}>Value</th>
          <th style={{ textAlign: 'right', padding: '12px 0', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' }}>ROI</th>
          <th style={{ textAlign: 'right', padding: '12px 0', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {agents.map((agent, i) => (
          <tr key={i} style={{
            borderBottom: `1px solid ${colors.borderDefault}`,
            transition: 'background 200ms cubic-bezier(0.16,1,0.3,1)',
            animation: `fadeUp 200ms cubic-bezier(0.16,1,0.3,1) both ${i * 50}ms`,
          }} onMouseEnter={(e) => (e.currentTarget.style.background = colors.bgSubtle)} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            <td style={{ padding: '16px 0', color: colors.textPrimary, fontWeight: '500' }}>{agent.name}</td>
            <td style={{ textAlign: 'right', padding: '16px 0', color: colors.textSecondary, fontFamily: 'IBM Plex Mono, monospace' }}>${agent.cost.toLocaleString()}</td>
            <td style={{ textAlign: 'right', padding: '16px 0', color: colors.textSecondary, fontFamily: 'IBM Plex Mono, monospace' }}>{agent.tasks.toLocaleString()}</td>
            <td style={{ textAlign: 'right', padding: '16px 0', color: colors.accentGreen, fontFamily: 'IBM Plex Mono, monospace', fontWeight: '500' }}>${agent.value.toLocaleString()}</td>
            <td style={{ textAlign: 'right', padding: '16px 0', color: agent.status === 'profitable' ? colors.accentGreen : agent.status === 'watch' ? colors.warningAmber : colors.dangerRed, fontFamily: 'IBM Plex Mono, monospace', fontWeight: '500' }}>{agent.roi}</td>
            <td style={{ textAlign: 'right', padding: '16px 0' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '4px',
                background: agent.status === 'profitable' ? colors.bgProfit : agent.status === 'watch' ? colors.bgWarning : colors.bgLoss,
                color: agent.status === 'profitable' ? colors.accentGreen : agent.status === 'watch' ? colors.warningAmber : colors.dangerRed,
                fontFamily: 'Inter, sans-serif',
                fontWeight: '500',
                fontSize: '12px'
              }}>
                {agent.status === 'profitable' ? '✓ Profitable' : agent.status === 'watch' ? '⚠ Watch' : '✗ Losing'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ROICalculator() {
  const [agents, setAgents] = useState(3);
  const [monthlySpend, setMonthlySpend] = useState(10000);
  const [hourlyRate, setHourlyRate] = useState(75);

  const wastefulSpend = monthlySpend * 0.23;
  const annualSavings = wastefulSpend * 12;
  const roiCost = agents < 5 ? 499 : agents <= 30 ? 2500 : 8000;
  const paybackDays = Math.ceil(roiCost / (wastefulSpend / 30));

  return (
    <div style={{
      background: colors.bgSurface,
      border: `1px solid ${colors.borderDefault}`,
      borderRadius: '12px',
      padding: '48px',
      maxWidth: '900px',
      margin: '0 auto',
      boxShadow: colors.shadowMd,
      animation: 'fadeUp 600ms cubic-bezier(0.16,1,0.3,1) both',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', marginBottom: '64px' }}>
        {/* Agents Slider */}
        <AnimatedSection animation="fadeUp" delay={0}>
          <div>
            <label style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Number of AI Agents</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <input
                type="range"
                min="1"
                max="100"
                value={agents}
                onChange={(e) => setAgents(parseInt(e.target.value))}
                style={{
                  flex: 1,
                  height: '6px',
                  borderRadius: '3px',
                  background: colors.accentGreenLight,
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
              />
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700', color: colors.textPrimary, minWidth: '40px', textAlign: 'right', animation: 'fadeIn 300ms cubic-bezier(0.16,1,0.3,1) both' }}>{agents}</span>
            </div>
          </div>
        </AnimatedSection>

        {/* Monthly Spend Input */}
        <AnimatedSection animation="fadeUp" delay={100}>
          <div>
            <label style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Monthly LLM Spend</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: colors.textSecondary, fontWeight: '600' }}>$</span>
              <input
                type="number"
                value={monthlySpend}
                onChange={(e) => setMonthlySpend(Math.max(0, parseInt(e.target.value) || 0))}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 28px',
                  border: `1px solid ${colors.borderDefault}`,
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  outline: 'none',
                  transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.accentGreen;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.accentGreenLight}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.borderDefault;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        </AnimatedSection>

        {/* Hourly Rate Input */}
        <AnimatedSection animation="fadeUp" delay={200}>
          <div>
            <label style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Employee Hourly Cost</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: colors.textSecondary, fontWeight: '600' }}>$</span>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Math.max(0, parseInt(e.target.value) || 0))}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 28px',
                  border: `1px solid ${colors.borderDefault}`,
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  outline: 'none',
                  transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.accentGreen;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.accentGreenLight}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.borderDefault;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* Results Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
        <AnimatedSection animation="fadeUp" delay={300}>
          <div style={{ background: colors.bgProfit, border: `1px solid ${colors.accentGreenBorder}`, borderRadius: '8px', padding: '24px', animation: 'fadeUp 600ms cubic-bezier(0.16,1,0.3,1) both 300ms' }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', marginBottom: '8px' }}>Monthly Wasteful Spend</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: '700', color: colors.accentGreen, marginBottom: '4px' }}>
              ${wastefulSpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: '13px', color: colors.textSecondary }}>~23% of your LLM spend is wasted</div>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={400}>
          <div style={{ background: colors.bgProfit, border: `1px solid ${colors.accentGreenBorder}`, borderRadius: '8px', padding: '24px', animation: 'fadeUp 600ms cubic-bezier(0.16,1,0.3,1) both 400ms' }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', marginBottom: '8px' }}>Annual Savings Potential</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: '700', color: colors.accentGreen, marginBottom: '4px' }}>
              ${annualSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: '13px', color: colors.textSecondary }}>Year-over-year with optimization</div>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={500}>
          <div style={{ background: colors.bgSubtle, border: `1px solid ${colors.borderDefault}`, borderRadius: '8px', padding: '24px', animation: 'fadeUp 600ms cubic-bezier(0.16,1,0.3,1) both 500ms' }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', marginBottom: '8px' }}>Layer ROI Monthly Cost</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
              ${roiCost.toLocaleString()}/mo
            </div>
            <div style={{ fontSize: '13px', color: colors.textSecondary }}>
              {agents < 5 ? 'Starter' : agents <= 30 ? 'Business' : 'Enterprise'} plan
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fadeUp" delay={600}>
          <div style={{ background: colors.bgSubtle, border: `1px solid ${colors.borderDefault}`, borderRadius: '8px', padding: '24px', animation: 'fadeUp 600ms cubic-bezier(0.16,1,0.3,1) both 600ms' }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', marginBottom: '8px' }}>Payback Period</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
              {paybackDays} days
            </div>
            <div style={{ fontSize: '13px', color: colors.textSecondary }}>Until Layer ROI pays for itself</div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
