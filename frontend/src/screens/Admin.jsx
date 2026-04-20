import { useState, useEffect } from 'react';
import { Users, Settings, Zap, CreditCard, X, Plus, Check } from 'lucide-react';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';

const colors = {
  bgPrimary: '#050505',
  bgSurface: '#0f0f0f',
  bgSubtle: '#151515',
  bgProfit: 'rgba(34,197,94,0.08)',
  bgLoss: 'rgba(239,68,68,0.08)',
  bgWarning: 'rgba(245,158,11,0.08)',
  borderDefault: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(255,255,255,0.14)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.55)',
  textTertiary: 'rgba(255,255,255,0.38)',
  accentGreen: '#22c55e',
  accentGreenLight: 'rgba(34,197,94,0.08)',
  accentGreenBorder: 'rgba(34,197,94,0.22)',
  dangerRed: '#ef4444',
  dangerLight: 'rgba(239,68,68,0.08)',
  dangerBorder: 'rgba(239,68,68,0.22)',
  warningAmber: '#f59e0b',
  warningLight: 'rgba(245,158,11,0.08)',
  shadowSm: '0 0 0 1px rgba(255,255,255,0.06)',
  shadowMd: '0 0 0 1px rgba(255,255,255,0.06), 0 6px 20px rgba(0,0,0,0.3)',
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState(() => {
    const target = window.sessionStorage.getItem('admin_tab_target');
    if (target) { window.sessionStorage.removeItem('admin_tab_target'); return target; }
    return 'team';
  });

  // Listen for tab changes while mounted
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.screen === 'admin' && e.detail?.tab) setActiveTab(e.detail.tab);
    };
    window.addEventListener('navigate-screen', handler);
    return () => window.removeEventListener('navigate-screen', handler);
  }, []);
  const [members, setMembers] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        let orgId = authService.org?.id;
        if (!orgId) { try { const t = localStorage.getItem("layeroi_token"); if (t) { orgId = JSON.parse(atob(t.split(".")[1])).orgId; } } catch(e) {} }

        if (!orgId) {
          setError('Organization not found');
          setLoading(false);
          return;
        }

        // Fetch all admin data in parallel
        const [membersRes, integrationsRes, settingsRes] = await Promise.all([
          apiService.getWorkspaceMembers(orgId),
          apiService.getIntegrations(orgId),
          apiService.getOrgSettings(orgId),
        ]);

        if (Array.isArray(membersRes)) {
          setMembers(membersRes);
        } else if (membersRes?.members) {
          setMembers(membersRes.members);
        }

        if (Array.isArray(integrationsRes)) {
          setIntegrations(integrationsRes);
        } else if (integrationsRes?.integrations) {
          setIntegrations(integrationsRes.integrations);
        }

        if (settingsRes) {
          setSettings(settingsRes);
        }

        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setInviting(true);
      let orgId = authService.org?.id;
        if (!orgId) { try { const t = localStorage.getItem("layeroi_token"); if (t) { orgId = JSON.parse(atob(t.split(".")[1])).orgId; } } catch(e) {} }
      await apiService.inviteTeamMember(orgId, inviteEmail, inviteRole);

      // Refresh members list
      const membersRes = await apiService.getWorkspaceMembers(orgId);
      if (Array.isArray(membersRes)) {
        setMembers(membersRes);
      } else if (membersRes?.members) {
        setMembers(membersRes.members);
      }

      setInviteEmail('');
      setInviteRole('member');
    } catch (err) {
      setError('Failed to invite member: ' + err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleTestIntegration = async (integrationId) => {
    try {
      await apiService.testIntegration(integrationId);
      // Update integration status
      setIntegrations(integrations.map(i =>
        i.id === integrationId ? { ...i, status: 'connected' } : i
      ));
    } catch (err) {
      setError('Failed to test integration: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
        <div style={{ fontSize: '16px' }}>Loading admin panel...</div>
      </div>
    );
  }

  if (error && activeTab === 'team') {
    return (
      <div style={{ background: '#fee2e2', border: `1px solid ${colors.dangerRed}`, color: colors.dangerRed, padding: '16px', borderRadius: '8px' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Error</div>
        <div style={{ fontSize: '14px' }}>{error}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: isMobile ? '28px' : '36px',
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: '12px',
        }}>
          Workspace Admin
        </h1>
        <p style={{ color: colors.textSecondary, fontSize: '16px' }}>
          Manage your organization, team, integrations, and billing
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '32px',
        borderBottom: `1px solid ${colors.borderDefault}`,
        overflowX: 'auto',
      }}>
        {[
          { id: 'team', label: 'Team', icon: Users },
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'integrations', label: 'Integrations', icon: Zap },
          { id: 'billing', label: 'Billing', icon: CreditCard },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === tab.id ? `3px solid ${colors.accentGreen}` : 'none',
                color: activeTab === tab.id ? colors.accentGreen : colors.textSecondary,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 200ms',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={18} />
              {!isMobile && tab.label}
            </button>
          );
        })}
      </div>

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '24px',
              fontWeight: '600',
              color: colors.textPrimary,
              marginBottom: '16px',
            }}>
              Invite Team Member
            </h2>
            <div style={{
              background: colors.bgSurface,
              border: `1px solid ${colors.borderDefault}`,
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
            }}>
              <div className='mono' style={{ fontSize: '10px', color: colors.textTertiary, letterSpacing: '0.1em', marginBottom: '8px' }}>COMING SOON</div>
              <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>
                Team invitations are being built. For now, share your API key with team members directly.
              </p>
            </div>
          </div>

          <div>
            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '24px',
              fontWeight: '600',
              color: colors.textPrimary,
              marginBottom: '16px',
            }}>
              Team Members ({members.length})
            </h2>
            {members.length === 0 ? (
              <div style={{
                background: colors.bgSurface,
                border: `1px solid ${colors.borderDefault}`,
                borderRadius: '8px',
                padding: '32px',
                textAlign: 'center',
                color: colors.textSecondary,
              }}>
                No team members yet
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.borderDefault}`, background: colors.bgSubtle }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: colors.textSecondary }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: colors.textSecondary }}>Role</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: colors.textSecondary }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: colors.textSecondary }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member, i) => (
                      <tr key={member.id} style={{ borderBottom: `1px solid ${colors.borderDefault}` }}>
                        <td style={{ padding: '12px', color: colors.textPrimary }}>{member.email}</td>
                        <td style={{ padding: '12px', color: colors.textSecondary }}>
                          <span style={{
                            background: colors.bgSubtle,
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'capitalize',
                          }}>
                            {member.role || 'member'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: colors.textSecondary }}>
                          <span style={{
                            color: member.status === 'active' ? colors.accentGreen : colors.textSecondary,
                            fontWeight: '500',
                            textTransform: 'capitalize',
                          }}>
                            {member.status || 'pending'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button style={{
                            background: 'transparent',
                            border: `1px solid ${colors.dangerRed}`,
                            color: colors.dangerRed,
                            padding: '4px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}>
                            <X size={14} style={{ display: 'inline' }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div>
          <div style={{
            background: colors.bgSurface,
            border: `1px solid ${colors.borderDefault}`,
            borderRadius: '8px',
            padding: '24px',
          }}>
            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '20px',
              fontWeight: '600',
              color: colors.textPrimary,
              marginBottom: '20px',
            }}>
              Organization Settings
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: '8px',
                }}>
                  Organization Name
                </label>
                <input
                  type="text"
                  defaultValue={settings.name || authService.org?.name || ''}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${colors.borderDefault}`,
                    borderRadius: '6px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                  }}
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: '8px',
                }}>
                  Email Domain
                </label>
                <input
                  type="text"
                  defaultValue={settings.domain || ''}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${colors.borderDefault}`,
                    borderRadius: '6px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                  }}
                  placeholder="company.com"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: '8px',
                }}>
                  Monthly Budget (USD)
                </label>
                <input
                  type="number"
                  defaultValue={settings.monthlyBudget || 10000}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${colors.borderDefault}`,
                    borderRadius: '6px',
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: '14px',
                  }}
                />
              </div>

              <button style={{
                background: colors.accentGreen,
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                alignSelf: 'flex-start',
              }}>
                <Check size={16} style={{ display: 'inline', marginRight: '8px' }} />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '24px',
            fontWeight: '600',
            color: colors.textPrimary,
            marginBottom: '16px',
          }}>
            Connected Integrations
          </h2>
          {integrations.length === 0 ? (
            <div style={{
              background: colors.bgSurface,
              border: `1px solid ${colors.borderDefault}`,
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center',
              color: colors.textSecondary,
            }}>
              <Zap size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>No integrations connected yet</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>Connect third-party platforms to automate your AI agent deployments</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}>
              {integrations.map(integration => (
                <div key={integration.id} style={{
                  background: colors.bgSurface,
                  border: `1px solid ${colors.borderDefault}`,
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: colors.bgSubtle,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                    }}>
                      {integration.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: colors.textPrimary }}>
                        {integration.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: integration.status === 'connected' ? colors.accentGreen : colors.textSecondary,
                      }}>
                        {integration.status === 'connected' ? '✓ Connected' : 'Disconnected'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTestIntegration(integration.id)}
                    style={{
                      padding: '8px 12px',
                      background: colors.accentBlue,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    Test Connection
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upgrade Modal */}
      {upgradeOpen && (
        <div onClick={e => e.target === e.currentTarget && setUpgradeOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '14px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'auto', padding: '32px' }}>
            <h2 className='serif' style={{ fontSize: '28px', color: 'white', margin: '0 0 24px' }}>Choose a plan</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                { id: 'starter', name: 'Starter', price: '$499', limit: '5 agents' },
                { id: 'business', name: 'Business', price: '$2,500', limit: '30 agents', highlight: true },
                { id: 'enterprise', name: 'Enterprise', price: '$8,500', limit: 'Unlimited' },
              ].map(p => (
                <div key={p.id} style={{ background: p.highlight ? 'rgba(34,197,94,0.04)' : '#151515', border: `1px solid ${p.highlight ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.09)'}`, borderRadius: '12px', padding: '24px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>{p.name}</div>
                  <div className='mono' style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>{p.price}<span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>/mo</span></div>
                  <div className='mono' style={{ fontSize: '11px', color: '#22c55e', margin: '8px 0 20px', letterSpacing: '0.06em' }}>{p.limit.toUpperCase()}</div>
                  <button onClick={async () => {
                    const token = localStorage.getItem('layeroi_token');
                    const res = await fetch('https://api.layeroi.com/payments/checkout', {
                      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ plan: p.id }),
                    });
                    const data = await res.json();
                    if (data.success && data.data?.checkout_url) window.location.href = data.data.checkout_url;
                  }} style={{ width: '100%', padding: '10px', background: p.highlight ? '#22c55e' : 'rgba(255,255,255,0.9)', color: '#050505', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Upgrade to {p.name} →
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setUpgradeOpen(false)} style={{ marginTop: '20px', background: 'none', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.7)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (() => {
        const PLAN_CATALOG = {
          free: { name: 'Free', price: '$0', cadence: '/month', features: ['2 agents', '14 days history', 'Basic metrics', 'Community support'] },
          starter: { name: 'Starter', price: '$499', cadence: '/month', features: ['5 agents', '90 days history', 'Weekly reports', 'Email support'] },
          business: { name: 'Business', price: '$2,500', cadence: '/month', features: ['30 agents', '1 year history', 'Real-time anomaly detection', 'Priority support', 'Custom integrations'] },
          enterprise: { name: 'Enterprise', price: '$8,500', cadence: '/month', features: ['Unlimited agents', '3 year history', 'SSO/SAML', 'Dedicated success manager', 'Custom SLA'] },
        };
        const org = JSON.parse(localStorage.getItem('layeroi_org') || 'null');
        const planKey = (org?.plan || 'free').toLowerCase();
        const plan = PLAN_CATALOG[planKey] || PLAN_CATALOG.free;
        const subId = org?.dodo_subscription_id;

        return (
          <div style={{ background: colors.bgSurface, border: `1px solid ${colors.borderDefault}`, borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${colors.borderDefault}` }}>
              <h2 className='serif' style={{ fontSize: '22px', color: colors.textPrimary, margin: 0 }}>Billing & Subscription</h2>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: colors.bgSubtle, border: `1px solid ${colors.borderDefault}`, borderRadius: '10px', padding: '20px' }}>
                  <div className='mono' style={{ fontSize: '10px', color: colors.textTertiary, letterSpacing: '0.12em' }}>CURRENT PLAN</div>
                  <div className='serif' style={{ fontSize: '36px', color: colors.textPrimary, margin: '8px 0 4px' }}>{plan.name}</div>
                  <div className='mono' style={{ fontSize: '14px', color: colors.textSecondary }}>{plan.price}<span style={{ color: colors.textTertiary }}>{plan.cadence}</span></div>
                </div>
                <div style={{ background: colors.bgSubtle, border: `1px solid ${colors.borderDefault}`, borderRadius: '10px', padding: '20px' }}>
                  <div className='mono' style={{ fontSize: '10px', color: colors.textTertiary, letterSpacing: '0.12em' }}>STATUS</div>
                  <div className='serif' style={{ fontSize: '20px', color: colors.textPrimary, margin: '8px 0 4px' }}>
                    {planKey === 'free' ? 'Active (Free tier)' : subId ? 'Active' : 'Pending'}
                  </div>
                  <div className='mono' style={{ fontSize: '11px', color: colors.textTertiary }}>
                    {subId ? 'ID: ' + subId.slice(0, 20) + '...' : 'No active subscription'}
                  </div>
                </div>
              </div>
              <h3 className='serif' style={{ fontSize: '18px', color: colors.textPrimary, margin: '0 0 12px' }}>Plan features</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.textSecondary, fontSize: '13px' }}>
                    <span style={{ color: colors.accentGreen }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setUpgradeOpen(true)} style={{ padding: '10px 18px', background: colors.accentGreen, color: '#050505', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  {planKey === 'free' ? 'Upgrade plan' : 'Change plan'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
