import { useState } from 'react';

const colors = {
  bgPrimary: '#fafaf9',
  bgSurface: '#ffffff',
  borderDefault: 'rgba(0,0,0,0.08)',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  accentGreen: '#16a34a',
  dangerRed: '#dc2626',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('https://api.layeroi.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success && data.data?.token) {
        localStorage.setItem('layeroi_token', data.data.token);
        window.location.href = '/dashboard';
      } else {
        setError(data.error?.message || 'Invalid email or password');
      }
    } catch {
      setError('Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: colors.bgPrimary, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <nav style={{ background: colors.bgSurface, borderBottom: `1px solid ${colors.borderDefault}`, padding: '0 40px', height: '64px', display: 'flex', alignItems: 'center' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ width: '8px', height: '8px', background: colors.accentGreen, borderRadius: '50%' }} />
          <span style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>layeroi</span>
        </a>
      </nav>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ background: colors.bgSurface, padding: '60px', borderRadius: '12px', width: '100%', maxWidth: '420px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: colors.textPrimary }}>Sign in to layeroi</h1>
          <p style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: '32px' }}>Enter your email and password to access your dashboard.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ background: '#fee2e2', border: `1px solid ${colors.dangerRed}`, color: colors.dangerRed, padding: '12px', borderRadius: '6px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com"
                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${colors.borderDefault}`, borderRadius: '6px', fontSize: '16px', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={8}
                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${colors.borderDefault}`, borderRadius: '6px', fontSize: '16px', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
            </div>

            <div style={{ textAlign: 'right' }}>
              <a href="/forgot-password" style={{ fontSize: '13px', color: colors.accentGreen, textDecoration: 'none' }}>Forgot password?</a>
            </div>

            <button type="submit" disabled={loading} style={{
              background: colors.accentGreen, color: 'white', padding: '14px', borderRadius: '6px',
              border: 'none', fontSize: '16px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>

            <p style={{ textAlign: 'center', color: colors.textSecondary, fontSize: '14px', marginTop: '16px' }}>
              Don't have an account? <a href="/signup" style={{ color: colors.accentGreen, textDecoration: 'none', fontWeight: '600' }}>Sign up free</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
