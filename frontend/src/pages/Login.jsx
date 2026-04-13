import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';

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
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.success && response.token) {
        localStorage.setItem('layeroi_token', response.token);
        localStorage.setItem('layeroi_user', JSON.stringify(response.user));
        navigate('/dashboard');
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: colors.bgPrimary, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <nav style={{ background: colors.bgSurface, borderBottom: `1px solid ${colors.borderDefault}`, padding: '0 40px', height: '64px', display: 'flex', alignItems: 'center' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ width: '8px', height: '8px', background: colors.accentGreen, borderRadius: '50%' }} />
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>Layer ROI</span>
        </a>
      </nav>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ background: colors.bgSurface, padding: '60px', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px', color: colors.textPrimary }}>Sign In</h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ background: '#fee2e2', border: `1px solid ${colors.dangerRed}`, color: colors.dangerRed, padding: '12px', borderRadius: '4px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.borderDefault}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif'
                }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.borderDefault}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif'
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: colors.accentGreen,
                color: 'white',
                padding: '12px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                marginTop: '12px'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p style={{ textAlign: 'center', color: colors.textSecondary, fontSize: '14px', marginTop: '16px' }}>
              Don't have an account? <a href="/signup" style={{ color: colors.accentGreen, textDecoration: 'none', fontWeight: '600' }}>Sign up</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
