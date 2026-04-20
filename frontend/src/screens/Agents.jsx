import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';
import { Icon } from './components/Icon';

const colors = {
  bgSurface: '#ffffff',
  borderDefault: 'rgba(0,0,0,0.08)',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  accentGreen: '#16a34a',
  dangerRed: '#dc2626',
  shadowSm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
};

export default function Agents() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', provider: 'openai' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        let orgId = authService.org?.id;
        if (!orgId) { try { const t = localStorage.getItem("layeroi_token"); if (t) { orgId = JSON.parse(atob(t.split(".")[1])).orgId; } } catch(e) {} }

        if (!orgId) {
          setError('Organization not found');
          setLoading(false);
          return;
        }

        const response = await apiService.getAgents(orgId);
        if (Array.isArray(response)) {
          setAgents(response);
        } else if (response && response.agents) {
          setAgents(response.agents);
        }
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load agents');
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
        <div style={{ fontSize: '16px' }}>Loading agents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: '#fee2e2', border: `1px solid ${colors.dangerRed}`, color: colors.dangerRed, padding: '16px', borderRadius: '8px' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Error loading agents</div>
        <div style={{ fontSize: '14px' }}>{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '32px', gap: isMobile ? '16px' : '0' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: isMobile ? '24px' : '32px', fontWeight: '700', color: colors.textPrimary }}>Agents</h2>
        <button onClick={() => setShowAddModal(true)} style={{
          background: '#22c55e',
          color: '#050505',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 200ms',
          whiteSpace: 'nowrap',
        }}>
          <Icon name='plus' size={16} /> Add Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.borderDefault}`,
          borderRadius: '8px',
          padding: '48px 32px',
          textAlign: 'center',
        }}>
          <p style={{ color: colors.textSecondary, fontSize: '16px', marginBottom: '16px' }}>
            No agents connected yet
          </p>
          <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
            Click "Add Agent" to connect your first AI agent and start tracking costs
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: isMobile ? '12px' : '20px',
        }}>
          {agents.map(agent => (
            <div key={agent.id} style={{
              background: colors.bgSurface,
              border: `1px solid ${colors.borderDefault}`,
              borderRadius: '8px',
              padding: isMobile ? '16px' : '24px',
              boxShadow: colors.shadowSm,
              transition: 'all 200ms',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.12)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = colors.shadowSm;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <h3 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '18px',
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: '16px',
              }}>
                {agent.name}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: 'Inter, sans-serif' }}>Cost (30d)</span>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: colors.textPrimary,
                    fontFamily: 'IBM Plex Mono, monospace',
                  }}>
                    ${agent.cost.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: 'Inter, sans-serif' }}>Tasks</span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: colors.textPrimary,
                    fontFamily: 'IBM Plex Mono, monospace',
                  }}>
                    {agent.tasks}
                  </span>
                </div>
                <div style={{
                  paddingTop: '12px',
                  borderTop: `1px solid ${colors.borderDefault}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: 'Inter, sans-serif' }}>ROI</span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: agent.roi > 1 ? colors.accentGreen : colors.dangerRed,
                    fontFamily: 'IBM Plex Mono, monospace',
                  }}>
                    {agent.roi.toFixed(1)}×
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Add Agent Modal */}
      {showAddModal && (
        <div onClick={e => e.target === e.currentTarget && setShowAddModal(false)} style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div style={{
            background: '#151515', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '14px', width: '100%', maxWidth: '440px', padding: '32px',
          }}>
            <h3 style={{ fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontSize: '24px', color: 'white', margin: '0 0 20px' }}>Add Agent</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginBottom: '6px', fontWeight: 500 }}>Agent Name</label>
              <input name="name" value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} placeholder="e.g. sales-outreach-agent"
                style={{ width: '100%', padding: '10px 14px', background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginBottom: '6px', fontWeight: 500 }}>Provider</label>
              <select value={newAgent.provider} onChange={e => setNewAgent({ ...newAgent, provider: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '8px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google Gemini</option>
                <option value="azure">Azure OpenAI</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowAddModal(false)} style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.14)', color: 'white', fontSize: '14px', fontWeight: 600,
              }}>Cancel</button>
              <button disabled={creating || !newAgent.name.trim()} onClick={async () => {
                setCreating(true);
                try {
                  let orgId;
                  try { const t = localStorage.getItem('layeroi_token'); if (t) orgId = JSON.parse(atob(t.split('.')[1])).orgId; } catch(e) {}
                  const createRes = await fetch('https://api.layeroi.com/api/agents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('layeroi_token')}` },
                    body: JSON.stringify({ name: newAgent.name.trim(), provider: newAgent.provider, orgId }),
                  });
                  const createData = await createRes.json();
                  if (!createRes.ok || !createData.success) {
                    setError(createData.error || 'Failed to create agent');
                    setCreating(false);
                    return;
                  }
                  setShowAddModal(false);
                  setNewAgent({ name: '', provider: 'openai' });
                  // Refetch agents list with direct fetch
                  const listRes = await fetch(`https://api.layeroi.com/api/agents?orgId=${orgId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('layeroi_token')}` },
                  });
                  const listData = await listRes.json();
                  setAgents(listData?.agents || listData?.data || (Array.isArray(listData) ? listData : []));
                } catch (err) {
                  setError('Failed to create agent');
                } finally {
                  setCreating(false);
                }
              }} style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                background: '#22c55e', color: '#050505', fontSize: '14px', fontWeight: 600,
                opacity: creating || !newAgent.name.trim() ? 0.5 : 1,
              }}>
                {creating ? 'Creating...' : 'Create Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
