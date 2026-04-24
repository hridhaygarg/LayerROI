import { useState, useEffect, useCallback } from 'react';

const API = 'https://api.layeroi.com';

const colors = {
  bgPrimary: '#050505',
  bgSurface: '#0f0f0f',
  bgSubtle: '#151515',
  bgProfit: 'rgba(34,197,94,0.08)',
  borderDefault: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(255,255,255,0.14)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.55)',
  textTertiary: 'rgba(255,255,255,0.38)',
  accentGreen: '#22c55e',
  accentGreenBorder: 'rgba(34,197,94,0.22)',
  dangerRed: '#ef4444',
  warningAmber: '#f59e0b',
};

const PILLAR_LABELS = {
  agent_economics: 'Agent Economics',
  cfo_translations: 'CFO Translation',
  build_in_public: 'Build in Public',
  market_commentary: 'Market Commentary',
};

const PILLAR_COLORS = {
  agent_economics: '#ef4444',
  cfo_translations: '#3b82f6',
  build_in_public: '#22c55e',
  market_commentary: '#f59e0b',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function XOps() {
  const [activeTab, setActiveTab] = useState('posts');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending_approval');
  const [stats, setStats] = useState({ pending: 0, posted_this_week: 0, total_threads: 0 });
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState('');
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const token = localStorage.getItem('layeroi_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'posts' ? 'posts' : activeTab === 'replies' ? 'replies' : 'dms';
      const res = await fetch(`${API}/api/xops/${endpoint}?status=${filter}`, { headers });
      const json = await res.json();
      setItems(json.data || []);
    } catch { setItems([]); }
    setLoading(false);
  }, [activeTab, filter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/xops/stats`, { headers });
      const json = await res.json();
      if (json.data) setStats(json.data);
    } catch {}
  }, []);

  useEffect(() => { fetchItems(); fetchStats(); }, [fetchItems, fetchStats]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await fetch(`${API}/api/xops/generate`, { method: 'POST', headers });
      showToast('3 new posts generated');
      fetchItems();
      fetchStats();
    } catch { showToast('Generation failed'); }
    setGenerating(false);
  };

  const handleGenerateThread = async () => {
    setGenerating(true);
    try {
      await fetch(`${API}/api/xops/generate-thread`, { method: 'POST', headers });
      showToast('Thread generated');
      fetchItems();
      fetchStats();
    } catch { showToast('Thread generation failed'); }
    setGenerating(false);
  };

  const handleAction = async (id, action) => {
    if (action === 'regenerate') setRegeneratingId(id);
    try {
      await fetch(`${API}/api/xops/posts/${id}/${action}`, { method: 'POST', headers });
      if (action === 'regenerate') {
        showToast('New draft generated');
      } else if (action === 'reject') {
        showToast('Rejected');
      }
      fetchItems();
      fetchStats();
    } catch { showToast('Action failed'); }
    setRegeneratingId(null);
  };

  const handleCopyAndOpen = async (item) => {
    try {
      await navigator.clipboard.writeText(item.content);
      showToast('Copied! Opening X composer...');
      await handleAction(item.id, 'approve');
      setTimeout(() => window.open('https://x.com/compose/post', '_blank'), 500);
    } catch { showToast('Copy failed'); }
  };

  const handleMarkPosted = (id) => handleAction(id, 'posted');

  const tabs = [
    { id: 'posts', label: 'Posts' },
    { id: 'replies', label: 'Replies' },
    { id: 'dms', label: 'DMs' },
  ];

  const filters = [
    { id: 'pending_approval', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'posted', label: 'Posted' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'all', label: 'All' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className='serif' style={{ fontSize: isMobile ? '28px' : '36px', color: 'white', margin: '0 0 6px' }}>X Ops</h1>
          <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>Content machine for @layeroi. Generate, review, post.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleGenerateThread} disabled={generating} style={{
            padding: '8px 14px', background: 'transparent', color: colors.accentGreen,
            border: `1px solid ${colors.accentGreenBorder}`, borderRadius: '8px',
            fontSize: '12px', fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.5 : 1,
          }}>{generating ? 'Generating...' : 'New Thread'}</button>
          <button onClick={handleGenerate} disabled={generating} style={{
            padding: '8px 14px', background: colors.accentGreen, color: '#050505',
            border: 'none', borderRadius: '8px',
            fontSize: '12px', fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.5 : 1,
          }}>{generating ? 'Generating...' : 'Generate 3 Posts'}</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'PENDING', value: stats.pending, color: colors.warningAmber },
          { label: 'POSTED THIS WEEK', value: stats.posted_this_week, color: colors.accentGreen },
          { label: 'THREADS', value: stats.total_threads, color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} style={{ background: colors.bgSurface, border: `1px solid ${colors.borderDefault}`, borderRadius: '10px', padding: '14px' }}>
            <div className='mono' style={{ fontSize: '10px', color: colors.textTertiary, letterSpacing: '0.1em', marginBottom: '6px' }}>{s.label}</div>
            <div className='mono' style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: `1px solid ${colors.borderDefault}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setFilter('pending_approval'); }} style={{
            padding: '10px 18px', background: 'none', border: 'none',
            borderBottom: activeTab === t.id ? `2px solid ${colors.accentGreen}` : '2px solid transparent',
            color: activeTab === t.id ? colors.accentGreen : colors.textSecondary,
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '5px 12px', borderRadius: '6px',
            background: filter === f.id ? colors.bgProfit : colors.bgSubtle,
            border: `1px solid ${filter === f.id ? colors.accentGreenBorder : colors.borderDefault}`,
            color: filter === f.id ? colors.accentGreen : colors.textSecondary,
            fontSize: '11px', fontWeight: 500, cursor: 'pointer',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textSecondary }}>
          <div style={{ fontSize: '15px', marginBottom: '8px' }}>No {activeTab} with status "{filter.replace('_', ' ')}"</div>
          <div style={{ fontSize: '13px', color: colors.textTertiary }}>
            {activeTab === 'posts' ? 'Hit "Generate 3 Posts" to create your first drafts.' : 'Coming soon — Modules 2-4 will populate this tab.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map(item => (
            <div key={item.id} style={{
              background: colors.bgSurface,
              border: `1px solid ${colors.borderDefault}`,
              borderRadius: '12px',
              padding: '18px',
              transition: 'border-color 200ms',
            }}>
              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                    background: `${PILLAR_COLORS[item.pillar]}15`,
                    color: PILLAR_COLORS[item.pillar],
                    border: `1px solid ${PILLAR_COLORS[item.pillar]}30`,
                  }}>{PILLAR_LABELS[item.pillar] || item.pillar}</span>
                  <span className='mono' style={{ fontSize: '10px', color: colors.textTertiary }}>
                    {item.post_type === 'thread' ? 'THREAD' : 'SINGLE'}
                  </span>
                  <span style={{ fontSize: '11px', color: colors.textTertiary }}>{timeAgo(item.generated_at)}</span>
                </div>
                <span className='mono' style={{ fontSize: '10px', color: item.char_count > 280 ? colors.dangerRed : colors.textTertiary }}>
                  {item.char_count} chars
                </span>
              </div>

              {/* Content */}
              {item.post_type === 'thread' && item.thread_parts ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {item.thread_parts.map((part, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '2px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.accentGreen, flexShrink: 0 }} />
                        {i < item.thread_parts.length - 1 && <div style={{ width: '2px', flex: 1, background: colors.accentGreenBorder }} />}
                      </div>
                      <p style={{ fontSize: '14px', color: colors.textPrimary, lineHeight: 1.6, margin: '0 0 12px', flex: 1 }}>{part}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '15px', color: colors.textPrimary, lineHeight: 1.6, margin: '0 0 14px', whiteSpace: 'pre-wrap' }}>
                  {item.content}
                </p>
              )}

              {/* Actions */}
              {(item.status === 'pending_approval' || item.status === 'approved') && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <button onClick={() => handleCopyAndOpen(item)} style={{
                    padding: '7px 14px', background: colors.accentGreen, color: '#050505',
                    border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  }}>Copy & Open X</button>

                  <button onClick={() => handleAction(item.id, 'regenerate')} disabled={regeneratingId === item.id} style={{
                    padding: '7px 14px', background: 'transparent', color: colors.textSecondary,
                    border: `1px solid ${colors.borderDefault}`, borderRadius: '6px',
                    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                    opacity: regeneratingId === item.id ? 0.5 : 1,
                  }}>{regeneratingId === item.id ? 'Regenerating...' : 'Regenerate'}</button>

                  <button onClick={() => handleAction(item.id, 'reject')} style={{
                    padding: '7px 14px', background: 'transparent', color: colors.dangerRed,
                    border: `1px solid rgba(239,68,68,0.22)`, borderRadius: '6px',
                    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  }}>Reject</button>

                  {item.status === 'approved' && (
                    <button onClick={() => handleMarkPosted(item.id)} style={{
                      padding: '7px 14px', background: 'transparent', color: colors.accentGreen,
                      border: `1px solid ${colors.accentGreenBorder}`, borderRadius: '6px',
                      fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                    }}>Mark Posted</button>
                  )}
                </div>
              )}

              {item.status === 'posted' && (
                <div className='mono' style={{ fontSize: '10px', color: colors.accentGreen, marginTop: '4px' }}>
                  POSTED {item.posted_at ? timeAgo(item.posted_at) : ''}
                </div>
              )}
              {item.status === 'rejected' && (
                <div className='mono' style={{ fontSize: '10px', color: colors.dangerRed, marginTop: '4px' }}>REJECTED</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: colors.bgSurface, border: `1px solid ${colors.accentGreenBorder}`,
          borderRadius: '10px', padding: '12px 20px', color: colors.accentGreen,
          fontSize: '13px', fontWeight: 500, zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>{toast}</div>
      )}
    </div>
  );
}
