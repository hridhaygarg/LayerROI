import { useState, useEffect } from 'react';
import { Users, Settings, Zap, CreditCard, X, Plus, Check } from 'lucide-react';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';

const colors = {
  bgPrimary: '#fafaf9',
  bgSurface: '#ffffff',
  bgSubtle: '#f5f5f4',
  borderDefault: 'rgba(0,0,0,0.08)',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  accentGreen: '#16a34a',
  accentBlue: '#0066cc',
  dangerRed: '#dc2626',
  shadowSm: '0 1px 3px rgba(0,0,0,0.08)',
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState('team');
  const [members, setMembers] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
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
        const orgId = authService.org?.id;

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
      const orgId = authService.org?.id;
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
            <form onSubmit={handleInviteMember} style={{
              background: colors.bgSurface,
              border: `1px solid ${colors.borderDefault}`,
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              gap: '12px',
              flexDirection: isMobile ? 'column' : 'row',
            }}>
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: `1px solid ${colors.borderDefault}`,
                  borderRadius: '6px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                }}
                disabled={inviting}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: `1px solid ${colors.borderDefault}`,
                  borderRadius: '6px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  background: colors.bgSurface,
                  color: colors.textPrimary,
                }}
                disabled={inviting}
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={inviting || !inviteEmail}
                style={{
                  padding: '10px 20px',
                  background: colors.accentGreen,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: inviting || !inviteEmail ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: inviting || !inviteEmail ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Plus size={16} />
                {inviting ? 'Inviting...' : 'Invite'}
              </button>
            </form>
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

      {/* Billing Tab */}
      {activeTab === 'billing' && (
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
              Billing & Subscription
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '20px', marginBottom: '32px' }}>
              <div style={{ background: colors.bgSubtle, padding: '20px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>Current Plan</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>Pro</div>
                <div style={{ fontSize: '14px', color: colors.textSecondary }}>$299/month billed annually</div>
              </div>

              <div style={{ background: colors.bgSubtle, padding: '20px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>Renewal Date</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>April 18, 2027</div>
                <div style={{ fontSize: '14px', color: colors.textSecondary }}>Auto-renews annually</div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${colors.borderDefault}`, paddingTop: '20px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: '12px',
              }}>
                Plan Features
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                {[
                  'Unlimited agents',
                  'Real-time cost tracking',
                  'Advanced analytics',
                  'Team collaboration (up to 10 members)',
                  'Priority support',
                  'Custom integrations',
                ].map((feature, i) => (
                  <li key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: colors.textSecondary,
                    fontSize: '14px',
                  }}>
                    <Check size={16} style={{ color: colors.accentGreen }} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button style={{
                padding: '12px 24px',
                background: colors.bgSubtle,
                color: colors.textPrimary,
                border: `1px solid ${colors.borderDefault}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
              }}>
                Change Plan
              </button>
              <button style={{
                padding: '12px 24px',
                background: colors.bgSubtle,
                color: colors.textPrimary,
                border: `1px solid ${colors.borderDefault}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
              }}>
                Billing History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
