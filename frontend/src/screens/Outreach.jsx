import React, { useState, useEffect, useCallback } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../components/Toast';
import { AnimatedSection } from '../components/AnimatedSection';
import EmptyState from '../components/EmptyState';

const colors = {
  bgPrimary: '#fafaf9',
  bgSurface: '#ffffff',
  bgSubtle: '#f5f5f4',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  borderDefault: 'rgba(0,0,0,0.08)',
  accentGreen: '#16a34a',
  accentBlue: '#0066cc',
  accentYellow: '#d97706',
  accentRed: '#dc2626',
};

export default function Outreach() {
  usePageTitle('Outreach');
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [prospects, setProspects] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [manualRunning, setManualRunning] = useState(false);

  const loadProspects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/outreach?status=${filter}&limit=50`);
      const data = await response.json();
      setProspects(data.data || []);
    } catch (err) {
      showToast('Failed to load prospects', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    loadProspects();
    loadStats();
  }, [filter, loadProspects]);

  async function loadStats() {
    try {
      const response = await fetch('/api/outreach/stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  async function handleManualRun() {
    if (!window.confirm('This will run the complete outreach workflow. Continue?')) return;

    try {
      setManualRunning(true);
      const response = await fetch('/api/outreach/run', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        showToast(
          `✅ Workflow complete: ${data.results.queueBuilt} prospects queued, ${data.results.messagesGenerated} messages generated, ${data.results.emailsSent} emails sent`,
          'success'
        );
        loadProspects();
        loadStats();
      }
    } catch (err) {
      console.error('Error running workflow:', err);
      showToast('Workflow failed', 'error');
    } finally {
      setManualRunning(false);
    }
  }

  async function handleSendFollowUps() {
    if (!window.confirm('Send follow-up reminders to 3+ day old unopened emails?')) return;

    try {
      const response = await fetch('/api/outreach/follow-ups', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        showToast(`✅ ${data.followUpsQueued} follow-ups queued`, 'success');
        loadProspects();
        loadStats();
      }
    } catch (err) {
      console.error('Error sending follow-ups:', err);
      showToast('Follow-up send failed', 'error');
    }
  }

  async function updateProspectStatus(prospectId, newStatus) {
    try {
      const response = await fetch(`/api/outreach/${prospectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        showToast('Status updated', 'success');
        loadProspects();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Status update failed', 'error');
    }
  }

  const statsRow = stats?.overallStats || {};
  const currentWeek = stats?.currentWeek || 'N/A';

  return (
    <div style={{ padding: '40px 20px', background: colors.bgPrimary, minHeight: '100vh' }}>
      <AnimatedSection variant="fadeUp" delay={0}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header with Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '36px',
                  fontWeight: '700',
                  color: colors.textPrimary,
                  margin: 0,
                  marginBottom: '8px',
                }}
              >
                Prospect Outreach
              </h1>
              <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
                Automated prospect research and personalized message generation • Week {currentWeek}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleManualRun}
                disabled={manualRunning}
                style={{
                  background: colors.accentGreen,
                  color: colors.bgSurface,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: manualRunning ? 'not-allowed' : 'pointer',
                  transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                  opacity: manualRunning ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!manualRunning) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(22,163,74,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {manualRunning ? '⏳ Running...' : '▶️ Run Workflow'}
              </button>

              <button
                onClick={handleSendFollowUps}
                style={{
                  background: colors.accentBlue,
                  color: colors.bgSurface,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,102,204,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                📧 Send Follow-ups
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <AnimatedSection variant="fadeUp" delay={100}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '40px',
              }}
            >
              {[
                {
                  label: 'Total Prospects',
                  value: statsRow.totalProspects || 0,
                  icon: '👥',
                  color: colors.accentGreen,
                },
                {
                  label: 'Emails Sent',
                  value: statsRow.totalSent || 0,
                  icon: '📧',
                  color: colors.accentBlue,
                },
                {
                  label: 'Replies',
                  value: statsRow.totalReplied || 0,
                  icon: '💬',
                  color: colors.accentYellow,
                },
                {
                  label: 'Avg Open Rate',
                  value: `${statsRow.avgOpenRate || 0}%`,
                  icon: '👁️',
                  color: colors.accentGreen,
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    background: colors.bgSurface,
                    border: `1px solid ${colors.borderDefault}`,
                    borderRadius: '8px',
                    padding: '20px',
                    transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                    animation: `fadeUp 600ms cubic-bezier(0.16,1,0.3,1) both`,
                    animationDelay: `${idx * 50}ms`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>

          {/* Filter Tabs */}
          <AnimatedSection variant="fadeUp" delay={150}>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                borderBottom: `1px solid ${colors.borderDefault}`,
              }}
            >
              {[
                { label: 'All', value: 'all' },
                { label: 'Pending', value: 'pending' },
                { label: 'Queued', value: 'queued' },
                { label: 'Sent', value: 'sent' },
                { label: 'Replied', value: 'replied' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  style={{
                    background: filter === tab.value ? colors.accentGreen : 'transparent',
                    color: filter === tab.value ? colors.bgSurface : colors.textSecondary,
                    border: 'none',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: filter === tab.value ? '600' : '500',
                    cursor: 'pointer',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                  onMouseEnter={(e) => {
                    if (filter !== tab.value) {
                      e.target.style.background = colors.bgSubtle;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filter !== tab.value) {
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </AnimatedSection>

          {/* Prospects Table */}
          <AnimatedSection variant="fadeUp" delay={200}>
            {loading ? (
              <div
                style={{
                  background: colors.bgSurface,
                  border: `1px solid ${colors.borderDefault}`,
                  borderRadius: '8px',
                  padding: '40px',
                  textAlign: 'center',
                  color: colors.textSecondary,
                }}
              >
                Loading prospects...
              </div>
            ) : prospects.length === 0 ? (
              <EmptyState
                title="No prospects yet"
                description="Run the workflow to generate prospects for this week."
                icon="🎯"
                action={handleManualRun}
                actionText="Generate Prospects"
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    background: colors.bgSurface,
                    border: `1px solid ${colors.borderDefault}`,
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <thead
                    style={{
                      background: colors.bgSubtle,
                      borderBottom: `1px solid ${colors.borderDefault}`,
                    }}
                  >
                    <tr>
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: colors.textSecondary,
                          textTransform: 'uppercase',
                        }}
                      >
                        Prospect
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: colors.textSecondary,
                          textTransform: 'uppercase',
                        }}
                      >
                        Company
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: colors.textSecondary,
                          textTransform: 'uppercase',
                        }}
                      >
                        ICP Score
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: colors.textSecondary,
                          textTransform: 'uppercase',
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: colors.textSecondary,
                          textTransform: 'uppercase',
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {prospects.map((prospect, idx) => (
                      <tr
                        key={prospect.id}
                        style={{
                          borderBottom: `1px solid ${colors.borderDefault}`,
                          transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                          animation: `fadeUp 400ms cubic-bezier(0.16,1,0.3,1) both`,
                          animationDelay: `${idx * 30}ms`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.bgSubtle;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = colors.bgSurface;
                        }}
                      >
                        <td
                          style={{
                            padding: '16px',
                            fontSize: '14px',
                            color: colors.textPrimary,
                            fontWeight: '500',
                          }}
                        >
                          <div>{prospect.prospect_name}</div>
                          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                            {prospect.prospect_title} • {prospect.prospect_email}
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: colors.textSecondary }}>
                          {prospect.company_name}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div
                            style={{
                              display: 'inline-block',
                              background: colors.bgSubtle,
                              padding: '4px 12px',
                              borderRadius: '4px',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: colors.accentGreen,
                            }}
                          >
                            {(prospect.icp_score * 100).toFixed(0)}%
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <select
                            value={prospect.status}
                            onChange={(e) => updateProspectStatus(prospect.id, e.target.value)}
                            style={{
                              background: colors.bgSurface,
                              border: `1px solid ${colors.borderDefault}`,
                              borderRadius: '4px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="queued">Queued</option>
                            <option value="sent">Sent</option>
                            <option value="replied">Replied</option>
                            <option value="unsubscribed">Unsubscribed</option>
                          </select>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          {prospect.email_sent_at && (
                            <span title={`Sent: ${new Date(prospect.email_sent_at).toLocaleDateString()}`}>
                              📧
                            </span>
                          )}
                          {prospect.email_opened_at && (
                            <span title={`Opened: ${new Date(prospect.email_opened_at).toLocaleDateString()}`}>
                              {' '}
                              👁️
                            </span>
                          )}
                          {prospect.response_received_at && (
                            <span
                              title={`Replied: ${new Date(prospect.response_received_at).toLocaleDateString()}`}
                            >
                              {' '}
                              💬
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AnimatedSection>

          {/* Message Preview (for debugging) */}
          {prospects.length > 0 && prospects[0]?.personalized_message && (
            <AnimatedSection variant="fadeUp" delay={250} style={{ marginTop: '40px' }}>
              <div
                style={{
                  background: colors.bgSurface,
                  border: `1px solid ${colors.borderDefault}`,
                  borderRadius: '8px',
                  padding: '20px',
                }}
              >
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    margin: '0 0 12px 0',
                    textTransform: 'uppercase',
                  }}
                >
                  Sample Message Preview
                </h3>
                <div
                  style={{
                    background: colors.bgSubtle,
                    border: `1px dashed ${colors.borderDefault}`,
                    borderRadius: '6px',
                    padding: '16px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: colors.textPrimary,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {prospects[0].personalized_message}
                </div>
              </div>
            </AnimatedSection>
          )}
        </div>
      </AnimatedSection>
    </div>
  );
}
