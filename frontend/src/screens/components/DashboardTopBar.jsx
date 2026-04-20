import { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

export function DashboardTopBar({ onToggleSidebar, screenName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('layeroi_user') || 'null');

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleLogout = () => {
    ['layeroi_token', 'layeroi_user', 'layeroi_org', 'layeroi_api_key'].forEach(k => localStorage.removeItem(k));
    window.location.href = '/';
  };

  const initials = user?.name
    ? user.name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || '?').toUpperCase();

  return (
    <header style={{
      height: '52px',
      background: 'rgba(10, 10, 10, 0.72)',
      backdropFilter: 'saturate(180%) blur(16px)',
      WebkitBackdropFilter: 'saturate(180%) blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky', top: 0, zIndex: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onToggleSidebar} aria-label='Toggle navigation' style={{
          padding: '6px', borderRadius: '6px', color: 'var(--white-55)', border: 'none', background: 'none', cursor: 'pointer',
          transition: 'background 140ms linear, color 140ms linear',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'white'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--white-55)'; }}>
          <Icon name='menu' size={18} />
        </button>
        <span style={{ fontSize: '13px', color: 'var(--white-55)', fontWeight: 500 }}>{screenName}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 2.4s ease-in-out infinite' }}/>
          <span className='mono' style={{ fontSize: '10px', color: 'var(--white-38)', letterSpacing: '0.08em' }}>LIVE</span>
        </div>

        <div style={{ position: 'relative' }} ref={menuRef}>
          <button onClick={() => setMenuOpen(o => !o)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 10px 5px 5px',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px', background: 'none', cursor: 'pointer',
            transition: 'background 140ms linear, border-color 140ms linear',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '5px',
              background: '#22c55e', color: '#050505',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
            }}>{initials}</div>
            <span style={{ color: 'var(--white-75)', fontSize: '13px', fontWeight: 500, maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || user?.email?.split('@')[0] || 'Account'}
            </span>
            <Icon name='chevron' size={12} />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              width: '220px', background: 'var(--surface-2)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px', padding: '6px',
              boxShadow: '0 0 0 1px var(--border-default), 0 16px 48px rgba(0,0,0,0.5)',
              animation: 'fade-in 140ms ease',
            }}>
              <div style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '2px' }}>{user?.name || 'Account'}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--white-55)' }}>{user?.email}</div>
              </div>
              <MenuBtn onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('navigate-screen', { detail: { screen: 'admin', tab: 'settings' } })); }}><Icon name='settings' size={14} />Settings</MenuBtn>
              <MenuBtn onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('navigate-screen', { detail: { screen: 'admin', tab: 'team' } })); }}><Icon name='agents' size={14} />Team & Members</MenuBtn>
              <MenuBtn onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('navigate-screen', { detail: { screen: 'admin', tab: 'billing' } })); }}><Icon name='budget' size={14} />Billing</MenuBtn>
              <MenuBtn onClick={() => { setMenuOpen(false); window.open('/docs', '_blank'); }}><Icon name='external' size={14} />Documentation</MenuBtn>
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
              <MenuBtn onClick={handleLogout} danger><Icon name='logout' size={14} />Log out</MenuBtn>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuBtn({ onClick, children, danger }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 12px', borderRadius: '6px',
      color: danger ? '#ef4444' : 'var(--white-75)',
      fontSize: '13px', fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer',
      transition: 'background 140ms linear',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {children}
    </button>
  );
}
