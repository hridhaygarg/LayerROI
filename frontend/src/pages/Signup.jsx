import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

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

function SdkOnboarding({ apiKey, colors }) {
  const [sdkStatus, setSdkStatus] = useState({ sdkInstalled: false, firstCallAt: null });
  const [copied, setCopied] = useState('');
  const token = localStorage.getItem('layeroi_token');

  useEffect(() => {
    if (sdkStatus.sdkInstalled) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('https://api.layeroi.com/api/orgs/me/sdk-status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.sdkInstalled) setSdkStatus(json);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [sdkStatus.sdkInstalled, token]);

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const mono = { fontFamily: 'IBM Plex Mono, monospace' };

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ width: '56px', height: '56px', background: colors.accentGreenLight, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>✓</div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>Your workspace is ready.</h2>
        <p style={{ color: colors.textSecondary, fontSize: '15px' }}>Install the SDK to start tracking your AI agents:</p>
      </div>

      {/* Install command */}
      <div style={{ background: colors.bgSubtle, border: `1px solid ${colors.borderDefault}`, borderRadius: '8px', padding: '14px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <code style={{ ...mono, fontSize: '13px', color: colors.textPrimary }}>$ npm install layeroi-sdk</code>
        <button onClick={() => copyText('npm install layeroi-sdk', 'install')} style={{ background: 'none', border: 'none', color: colors.accentGreen, cursor: 'pointer', fontSize: '12px', fontWeight: 600, ...mono }}>{copied === 'install' ? 'Copied!' : 'Copy'}</button>
      </div>

      {/* API key */}
      <div style={{ background: colors.bgSubtle, border: `1px solid ${colors.borderDefault}`, borderRadius: '8px', padding: '14px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <code style={{ ...mono, fontSize: '12px', color: colors.textSecondary, wordBreak: 'break-all' }}>LAYEROI_API_KEY={apiKey}</code>
        <button onClick={() => copyText(apiKey, 'key')} style={{ background: 'none', border: 'none', color: colors.accentGreen, cursor: 'pointer', fontSize: '12px', fontWeight: 600, ...mono, flexShrink: 0, marginLeft: '8px' }}>{copied === 'key' ? 'Copied!' : 'Copy'}</button>
      </div>

      {/* Code example */}
      <pre style={{ background: colors.bgSubtle, border: `1px solid ${colors.borderDefault}`, borderRadius: '8px', padding: '16px', marginBottom: '20px', fontSize: '12px', ...mono, color: colors.textSecondary, lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>{`import { layeroi } from 'layeroi-sdk';
import OpenAI from 'openai';

layeroi.init({ apiKey: process.env.LAYEROI_API_KEY });
const openai = layeroi.wrap(new OpenAI(), { agent: 'my-agent' });`}</pre>

      {/* SDK status indicator */}
      <div style={{ background: sdkStatus.sdkInstalled ? 'rgba(22,163,74,0.06)' : colors.bgSubtle, border: `1px solid ${sdkStatus.sdkInstalled ? 'rgba(22,163,74,0.2)' : colors.borderDefault}`, borderRadius: '8px', padding: '14px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {sdkStatus.sdkInstalled ? (
          <>
            <span style={{ color: colors.accentGreen, fontSize: '16px' }}>✓</span>
            <span style={{ fontSize: '13px', color: colors.accentGreen, fontWeight: 500 }}>
              SDK connected — first call received{sdkStatus.firstCallAt ? ` at ${new Date(sdkStatus.firstCallAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}.{' '}
              <a href="/dashboard" style={{ color: colors.accentGreen, fontWeight: 600, textDecoration: 'underline' }}>View your dashboard →</a>
            </span>
          </>
        ) : (
          <>
            <span style={{ display: 'inline-block', width: '14px', height: '14px', border: `2px solid ${colors.borderStrong}`, borderTopColor: colors.accentGreen, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '13px', color: colors.textTertiary }}>Waiting for first SDK call...</span>
          </>
        )}
      </div>

      {/* Secondary CTA */}
      <button onClick={() => { window.location.href = '/dashboard'; }} style={{ width: '100%', background: 'transparent', color: colors.textSecondary, padding: '12px', borderRadius: '6px', border: `1px solid ${colors.borderDefault}`, fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginBottom: '16px' }}>Explore demo dashboard</button>

      {/* Demoted Path A */}
      <details style={{ textAlign: 'left' }}>
        <summary style={{ fontSize: '13px', color: colors.textTertiary, cursor: 'pointer' }}>Have an OpenAI admin key? Import historical billing data instead.</summary>
        <div style={{ marginTop: '12px', padding: '12px', background: colors.bgSubtle, borderRadius: '6px', border: `1px solid ${colors.borderDefault}` }}>
          <p style={{ fontSize: '13px', color: colors.textTertiary, marginBottom: '8px' }}>Connect your OpenAI billing API to import historical cost data:</p>
          <button onClick={() => { window.location.href = '/sources'; }} style={{ background: 'none', border: `1px solid ${colors.borderDefault}`, color: colors.textSecondary, padding: '8px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Go to Sources →</button>
        </div>
      </details>
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email', 'details', 'complete'
  const [formData, setFormData] = useState({ email: '', name: '', company: '', password: '' });
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

    if (!formData.email || !formData.name || !formData.company || !formData.password) {
      setError('All fields are required');
      setLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('https://api.layeroi.com/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success && result.token) {
        localStorage.setItem('layeroi_token', result.token);
        if (result.user) localStorage.setItem('layeroi_user', JSON.stringify(result.user));
        if (result.organisation) localStorage.setItem('layeroi_org', JSON.stringify(result.organisation));
        if (result.apiKey) {
          localStorage.setItem('layeroi_api_key', result.apiKey);
          setApiKey(result.apiKey);
        }
        setStep('complete');
      } else {
        setError(result.error?.message || 'Signup failed');
      }
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
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
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>layeroi</span>
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

          {/* Value statement */}
          <div style={{ background: 'rgba(22,163,74,0.04)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: '12px', padding: '24px' }}>
            <p style={{ fontSize: '17px', color: colors.textPrimary, fontStyle: 'italic', marginBottom: '12px', lineHeight: 1.5 }}>
              Most companies discover 20–30% of their AI agent spend is going to agents with negative ROI — once they can actually measure it.
            </p>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: colors.accentGreen, letterSpacing: '0.06em', fontWeight: 600 }}>THE LAYEROI THESIS</div>
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

              {[
                { label: 'Full name', name: 'name', type: 'text', placeholder: 'Your name' },
                { label: 'Work email', name: 'email', type: 'email', placeholder: 'sarah@company.com' },
                { label: 'Company', name: 'company', type: 'text', placeholder: 'Acme Corp' },
                { label: 'Password', name: 'password', type: 'password', placeholder: 'Min 8 characters' },
              ].map(field => (
                <div key={field.name}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>{field.label}</label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required
                    minLength={field.name === 'password' ? 8 : undefined}
                    style={{ width: '100%', padding: '12px 16px', border: `1px solid ${colors.borderDefault}`, borderRadius: '6px', fontFamily: 'Inter, sans-serif', fontSize: '16px', background: colors.bgSurface, color: colors.textPrimary, transition: 'all 200ms', boxSizing: 'border-box' }}
                    onFocus={(e) => (e.target.style.borderColor = colors.accentGreen)}
                    onBlur={(e) => (e.target.style.borderColor = colors.borderDefault)}
                  />
                </div>
              ))}

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
                  placeholder="Your name"
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
            <SdkOnboarding apiKey={apiKey} colors={colors} />
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
      `}</style>
    </div>
  );
}
