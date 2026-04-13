import { useState } from 'react';
import { api } from '../config/api';

const colors = {
  bgPrimary: '#fafaf9',
  bgSurface: '#ffffff',
  bgSubtle: '#f5f5f4',
  bgProfit: '#f0fdf4',
  borderDefault: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.15)',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  accentGreen: '#16a34a',
  accentGreenLight: '#dcfce7',
  accentGreenBorder: '#86efac',
  dangerRed: '#dc2626',
  shadowSm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 6px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
};

export default function Signup() {
  const [step, setStep] = useState('email'); // 'email', 'details', 'complete'
  const [formData, setFormData] = useState({ email: '', name: '', company: '' });
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.name || !formData.company) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/signup', formData);

      if (response.success && response.token && response.apiKey) {
        localStorage.setItem('layeroi_token', response.token);
        localStorage.setItem('layeroi_api_key', response.apiKey);
        localStorage.setItem('layeroi_org', JSON.stringify(response.organisation));
        setApiKey(response.apiKey);
        setStep('complete');
      } else {
        setError(response.error || 'Signup failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    // For now, just complete the signup without sending the details
    // In a real app, you'd update the user profile here
    setStep('complete');
  };

  const skipDetails = () => {
    setStep('complete');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
  };

  return (
    <div style={{ background: colors.bgPrimary, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{ background: colors.bgSurface, borderBottom: `1px solid ${colors.borderDefault}`, padding: '0 40px', height: '64px', display: 'flex', alignItems: 'center' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ width: '8px', height: '8px', background: colors.accentGreen, borderRadius: '50%' }} />
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>Layer ROI</span>
        </a>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', minHeight: 'calc(100vh - 64px)' }}>
        {/* Left Side */}
        <div style={{ background: colors.bgSurface, padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '48px', borderRight: `1px solid ${colors.borderDefault}` }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '40px', fontWeight: '700', color: colors.textPrimary, marginBottom: '24px', lineHeight: 1.2 }}>Get financial clarity in 15 minutes</h1>
            <p style={{ fontSize: '16px', color: colors.textSecondary, lineHeight: 1.6, marginBottom: '32px' }}>No credit card required. Free tier covers up to 2 agents. Upgrade anytime.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ color: colors.accentGreen, fontWeight: 'bold', fontSize: '18px', marginTop: '-2px' }}>✓</span>
                <div>
                  <div style={{ fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>Real-time cost tracking</div>
                  <div style={{ fontSize: '14px', color: colors.textSecondary }}>See exactly how much each agent is spending</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ color: colors.accentGreen, fontWeight: 'bold', fontSize: '18px', marginTop: '-2px' }}>✓</span>
                <div>
                  <div style={{ fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>Automatic anomaly detection</div>
                  <div style={{ fontSize: '14px', color: colors.textSecondary }}>Get alerted before a runaway loop burns your budget</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ color: colors.accentGreen, fontWeight: 'bold', fontSize: '18px', marginTop: '-2px' }}>✓</span>
                <div>
                  <div style={{ fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>Monthly P&L statements</div>
                  <div style={{ fontSize: '14px', color: colors.textSecondary }}>Board-ready financial reports for your AI team</div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div style={{ background: colors.bgSubtle, border: `1px solid ${colors.borderDefault}`, borderRadius: '12px', padding: '24px' }}>
            <p style={{ fontSize: '15px', color: colors.textSecondary, fontStyle: 'italic', marginBottom: '16px', lineHeight: 1.6 }}>"We went from having zero visibility into agent costs to seeing exactly which ones are money makers. Layer ROI showed us we were losing $40k/month on one agent."</p>
            <div style={{ fontWeight: '600', color: colors.textPrimary, fontSize: '14px' }}>Sarah Chen</div>
            <div style={{ fontSize: '13px', color: colors.textTertiary }}>CFO, FinTech Startup</div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div style={{ background: colors.bgPrimary, padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>Create your account</h2>
                <p style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: '24px' }}>Just your email to get started. We'll generate your API key instantly.</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>Work email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="sarah@company.com"
                  style={{ width: '100%', padding: '12px 16px', border: `1px solid ${colors.borderDefault}`, borderRadius: '6px', fontFamily: 'Inter, sans-serif', fontSize: '16px', background: colors.bgSurface, color: colors.textPrimary, transition: 'all 200ms' }}
                  onFocus={(e) => (e.target.style.borderColor = colors.accentGreen)}
                  onBlur={(e) => (e.target.style.borderColor = colors.borderDefault)}
                />
              </div>

              {error && <div style={{ padding: '12px', background: '#fef2f2', border: `1px solid ${colors.dangerRed}`, borderRadius: '6px', color: colors.dangerRed, fontSize: '14px' }}>{error}</div>}

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', background: colors.accentGreen, color: colors.bgSurface, padding: '14px', borderRadius: '6px', border: 'none', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 200ms' }}
                onMouseDown={(e) => !loading && (e.target.style.transform = 'scale(0.98)')}
                onMouseUp={(e) => !loading && (e.target.style.transform = 'scale(1)')}
              >
                {loading ? 'Creating account...' : 'Get API key →'}
              </button>

              <p style={{ fontSize: '12px', color: colors.textTertiary, textAlign: 'center' }}>By signing up, you agree to our Terms of Service and Privacy Policy</p>
            </form>
          )}

          {step === 'details' && (
            <form onSubmit={handleDetailsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>Tell us about yourself</h2>
                <p style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: '24px' }}>Optional. Helps us personalize your dashboard.</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>Full name <span style={{ color: colors.textTertiary }}>optional</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Sarah Chen"
                  style={{ width: '100%', padding: '12px 16px', border: `1px solid ${colors.borderDefault}`, borderRadius: '6px', fontFamily: 'Inter, sans-serif', fontSize: '16px', background: colors.bgSurface, color: colors.textPrimary, transition: 'all 200ms' }}
                  onFocus={(e) => (e.target.style.borderColor = colors.accentGreen)}
                  onBlur={(e) => (e.target.style.borderColor = colors.borderDefault)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>Company <span style={{ color: colors.textTertiary }}>optional</span></label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Your company"
                  style={{ width: '100%', padding: '12px 16px', border: `1px solid ${colors.borderDefault}`, borderRadius: '6px', fontFamily: 'Inter, sans-serif', fontSize: '16px', background: colors.bgSurface, color: colors.textPrimary, transition: 'all 200ms' }}
                  onFocus={(e) => (e.target.style.borderColor = colors.accentGreen)}
                  onBlur={(e) => (e.target.style.borderColor = colors.borderDefault)}
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', background: colors.accentGreen, color: colors.bgSurface, padding: '14px', borderRadius: '6px', border: 'none', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 200ms' }}
                onMouseDown={(e) => (e.target.style.transform = 'scale(0.98)')}
                onMouseUp={(e) => (e.target.style.transform = 'scale(1)')}
              >
                Complete signup →
              </button>

              <button
                type="button"
                onClick={skipDetails}
                style={{ width: '100%', background: 'transparent', color: colors.textSecondary, padding: '12px', borderRadius: '6px', border: `1px solid ${colors.borderDefault}`, fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 200ms' }}
                onMouseDown={(e) => (e.target.style.transform = 'scale(0.98)')}
                onMouseUp={(e) => (e.target.style.transform = 'scale(1)')}
              >
                Skip for now
              </button>
            </form>
          )}

          {step === 'complete' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', background: colors.accentGreenLight, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>✓</div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '12px' }}>Ready to track costs!</h2>
              <p style={{ color: colors.textSecondary, marginBottom: '32px', fontSize: '16px' }}>Your API key is ready. Update one line of code in your agent.</p>

              <div style={{ background: colors.bgSubtle, border: `1px solid ${colors.borderDefault}`, borderRadius: '8px', padding: '16px', marginBottom: '24px', position: 'relative' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: colors.textPrimary, wordBreak: 'break-all', padding: '12px', background: colors.bgSurface, borderRadius: '4px', border: `1px solid ${colors.borderDefault}` }}>
                  {apiKey}
                </div>
                <button
                  onClick={copyToClipboard}
                  style={{ position: 'absolute', top: '16px', right: '16px', background: colors.accentGreen, color: colors.bgSurface, border: 'none', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 200ms' }}
                  onMouseDown={(e) => (e.target.style.transform = 'scale(0.95)')}
                  onMouseUp={(e) => (e.target.style.transform = 'scale(1)')}
                >
                  Copy
                </button>
              </div>

              <div style={{ background: colors.bgProfit, border: `1px solid ${colors.accentGreenBorder}`, borderRadius: '8px', padding: '16px', marginBottom: '32px', textAlign: 'left' }}>
                <div style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: '600', marginBottom: '12px' }}>Next: Connect your first agent</div>
                <code style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: colors.textSecondary, backgroundColor: 'rgba(0,0,0,0.02)', padding: '8px', borderRadius: '4px', display: 'block', whiteSpace: 'pre-wrap' }}>
{`baseURL: 'https://api.layeroi.com'
apiKey: '${apiKey}'`}
                </code>
              </div>

              <a href="/dashboard" style={{ width: '100%', display: 'inline-block', background: colors.accentGreen, color: colors.bgSurface, padding: '12px', borderRadius: '6px', textDecoration: 'none', fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 200ms', textAlign: 'center' }} onMouseDown={(e) => (e.target.style.transform = 'scale(0.98)')} onMouseUp={(e) => (e.target.style.transform = 'scale(1)')}>Go to dashboard →</a>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
      `}</style>
    </div>
  );
}
