import { Icon } from './Icon';

const MAIN_NAV = [
  { icon: 'overview', label: 'Overview', id: 'overview' },
  { icon: 'agents', label: 'Agents', id: 'agents' },
  { icon: 'budget', label: 'Budget', id: 'budget' },
  { icon: 'integrations', label: 'Sources', id: 'sources' },
  { icon: 'reports', label: 'Reports', id: 'report' },
];

const FOUNDER_NAV = [
  { icon: 'outreach', label: 'Outreach', id: 'outreach' },
  { icon: 'outreach', label: 'X Ops', id: 'xops' },
];

const ACCOUNT_NAV = [
  { icon: 'integrations', label: 'Admin', id: 'admin' },
];

export function DashboardSidebar({ active, onNavigate, onUpgrade, onClose }) {
  const org = JSON.parse(localStorage.getItem('layeroi_org') || 'null');
  const user = JSON.parse(localStorage.getItem('layeroi_user') || 'null');
  const isSuperadmin = user?.is_superadmin === true;
  const plan = org?.plan || 'free';
  const limit = org?.plan_agent_limit ?? 2;

  return (
    <aside style={{
      width: '232px', flexShrink: 0,
      background: 'var(--surface-1)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 50,
      overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <img src='/brand/layeroi-logo.svg' alt='layeroi' style={{ height: '28px', width: 'auto', display: 'block' }} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        <div className='mono' style={{ fontSize: '10px', color: 'var(--white-38)', letterSpacing: '0.12em', padding: '0 12px 8px', fontWeight: 500 }}>MAIN</div>
        {MAIN_NAV.map(item => (
          <button key={item.id} onClick={() => { onNavigate(item.id); if (onClose) onClose(); }} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '8px 12px', marginBottom: '1px', borderRadius: '6px',
            background: active === item.id ? 'var(--green-soft)' : 'transparent',
            color: active === item.id ? '#22c55e' : 'var(--white-75)',
            fontSize: '13.5px', fontWeight: active === item.id ? 600 : 500,
            textAlign: 'left', border: 'none', cursor: 'pointer',
            transition: 'background 140ms linear, color 140ms linear',
          }}
          onMouseEnter={e => { if (active !== item.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'white'; }}}
          onMouseLeave={e => { if (active !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--white-75)'; }}}>
            <Icon name={item.icon} size={17} />
            <span>{item.label}</span>
          </button>
        ))}

        {isSuperadmin && (
          <>
            <div className='mono' style={{ fontSize: '10px', color: 'var(--white-38)', letterSpacing: '0.12em', padding: '16px 12px 8px', fontWeight: 500 }}>FOUNDER</div>
            {FOUNDER_NAV.map(item => (
              <button key={item.id} onClick={() => { onNavigate(item.id); if (onClose) onClose(); }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 12px', marginBottom: '1px', borderRadius: '6px',
                background: active === item.id ? 'var(--green-soft)' : 'transparent',
                color: active === item.id ? '#22c55e' : 'var(--white-75)',
                fontSize: '13.5px', fontWeight: active === item.id ? 600 : 500,
                textAlign: 'left', border: 'none', cursor: 'pointer',
                transition: 'background 140ms linear, color 140ms linear',
              }}
              onMouseEnter={e => { if (active !== item.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'white'; }}}
              onMouseLeave={e => { if (active !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--white-75)'; }}}>
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
              </button>
            ))}
          </>
        )}

        <div className='mono' style={{ fontSize: '10px', color: 'var(--white-38)', letterSpacing: '0.12em', padding: '16px 12px 8px', fontWeight: 500 }}>ACCOUNT</div>
        {ACCOUNT_NAV.map(item => (
          <button key={item.id} onClick={() => { onNavigate(item.id); if (onClose) onClose(); }} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '8px 12px', marginBottom: '1px', borderRadius: '6px',
            background: active === item.id ? 'var(--green-soft)' : 'transparent',
            color: active === item.id ? '#22c55e' : 'var(--white-75)',
            fontSize: '13.5px', fontWeight: active === item.id ? 600 : 500,
            textAlign: 'left', border: 'none', cursor: 'pointer',
            transition: 'background 140ms linear, color 140ms linear',
          }}
          onMouseEnter={e => { if (active !== item.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'white'; }}}
          onMouseLeave={e => { if (active !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--white-75)'; }}}>
            <Icon name={item.icon} size={17} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Plan card */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{
          background: plan === 'free' ? 'var(--green-soft)' : 'var(--surface-2)',
          border: `1px solid ${plan === 'free' ? 'rgba(34,197,94,0.22)' : 'var(--border-default)'}`,
          borderRadius: '10px', padding: '16px',
        }}>
          <div className='mono' style={{ fontSize: '10.5px', color: plan === 'free' ? '#22c55e' : 'var(--white-55)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '8px' }}>
            {plan.toUpperCase()} PLAN
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--white-55)', marginBottom: plan === 'enterprise' ? 0 : '12px', lineHeight: 1.5 }}>
            {limit === -1 ? 'Unlimited agents' : `${limit} agents included`}
          </div>
          {plan === 'free' && (
            <button onClick={onUpgrade} style={{
              width: '100%', padding: '8px 12px',
              background: '#22c55e', color: '#050505',
              borderRadius: '6px', fontSize: '12.5px', fontWeight: 600,
              border: 'none', cursor: 'pointer',
            }}>Upgrade plan →</button>
          )}
          {plan === 'starter' && (
            <button onClick={onUpgrade} style={{
              width: '100%', padding: '8px 12px',
              background: '#22c55e', color: '#050505',
              borderRadius: '6px', fontSize: '12.5px', fontWeight: 600,
              border: 'none', cursor: 'pointer',
            }}>Upgrade to Business →</button>
          )}
          {plan === 'business' && (
            <button onClick={onUpgrade} style={{
              width: '100%', padding: '8px 12px',
              background: 'transparent', color: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '6px', fontSize: '12.5px', fontWeight: 500,
              cursor: 'pointer',
            }}>Manage plan</button>
          )}
        </div>
      </div>
    </aside>
  );
}
