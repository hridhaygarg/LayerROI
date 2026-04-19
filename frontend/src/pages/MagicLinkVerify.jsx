import { useState, useEffect } from 'react';

export default function MagicLinkVerify() {
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setError('No login token found. Please request a new login link.');
      return;
    }

    (async () => {
      try {
        const res = await fetch('https://api.layeroi.com/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (data.success && data.token) {
          localStorage.setItem('layeroi_token', data.token);
          setStatus('success');
          setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
        } else {
          setStatus('error');
          setError(data.error || 'Invalid or expired login link.');
        }
      } catch {
        setStatus('error');
        setError('Could not verify. Please try again.');
      }
    })();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', background: '#fafaf9' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '40px' }}>
        {status === 'verifying' && (
          <>
            <div style={{ fontSize: '32px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⟳</div>
            <h1 style={{ fontSize: '22px', color: '#111', marginBottom: '8px' }}>Signing you in...</h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Verifying your login link.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ width: '56px', height: '56px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px', border: '2px solid #16a34a' }}>✓</div>
            <h1 style={{ fontSize: '22px', color: '#111', marginBottom: '8px' }}>You're in!</h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Redirecting to your dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ width: '56px', height: '56px', background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px', border: '2px solid #dc2626' }}>✕</div>
            <h1 style={{ fontSize: '22px', color: '#111', marginBottom: '8px' }}>Login link invalid</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>{error}</p>
            <a href="/login" style={{ display: 'inline-block', background: '#16a34a', color: 'white', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
              Request new link →
            </a>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
