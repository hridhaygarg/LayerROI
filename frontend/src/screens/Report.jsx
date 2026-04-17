import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';

const colors = {
  bgSurface: '#ffffff',
  borderDefault: 'rgba(0,0,0,0.08)',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  accentGreen: '#16a34a',
  dangerRed: '#dc2626',
  shadowSm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
};

export default function Report() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [reportData, setReportData] = useState({
    totalSpend: 0,
    valueGenerated: 0,
    roiMultiple: 0,
    problematicAgent: null,
    estimatedSavings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const orgId = authService.org?.id;

        if (!orgId) {
          setError('Organization not found');
          setLoading(false);
          return;
        }

        // Fetch dashboard stats and cost breakdown for report
        const [statsResponse, breakdownResponse] = await Promise.all([
          apiService.getDashboardStats(orgId),
          apiService.getCostsBreakdown(orgId, 'agent'),
        ]);

        if (statsResponse) {
          const problematicAgent = breakdownResponse?.agents?.find(a => a.roi < 1);
          setReportData({
            totalSpend: statsResponse.totalSpend || 0,
            valueGenerated: statsResponse.valueGenerated || 0,
            roiMultiple: statsResponse.roiMultiple || 0,
            problematicAgent: problematicAgent || null,
            estimatedSavings: problematicAgent ? (problematicAgent.cost * 2.5) : 0,
          });
        }

        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
        <div style={{ fontSize: '16px' }}>Generating report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: '#fee2e2', border: `1px solid ${colors.dangerRed}`, color: colors.dangerRed, padding: '16px', borderRadius: '8px' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Error loading report</div>
        <div style={{ fontSize: '14px' }}>{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: '32px',
        gap: isMobile ? '16px' : '0',
      }}>
        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: isMobile ? '24px' : '32px',
          fontWeight: '700',
          color: colors.textPrimary,
        }}>
          Reports
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            background: colors.accentGreen,
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all 200ms',
          }}
          onMouseDown={(e) => (e.target.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.target.style.transform = 'scale(1)')}
          >
            Send Now
          </button>
          <button style={{
            background: 'transparent',
            color: colors.accentGreen,
            border: `1.5px solid ${colors.accentGreen}`,
            padding: '10px 18px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all 200ms',
          }}
          onMouseDown={(e) => (e.target.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.target.style.transform = 'scale(1)')}
          >
            Schedule
          </button>
        </div>
      </div>

      <div style={{
        background: colors.bgSurface,
        color: colors.textPrimary,
        borderRadius: '8px',
        border: `1px solid ${colors.borderDefault}`,
        padding: '48px',
        maxWidth: '900px',
        boxShadow: colors.shadowSm,
      }}>
        <h1 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '12px',
          color: colors.textPrimary,
        }}>
          layeroi Weekly Report
        </h1>
        <p style={{
          color: colors.textSecondary,
          marginBottom: '32px',
          fontSize: '14px',
        }}>
          Month of {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>

        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '20px',
          fontWeight: '600',
          marginTop: '32px',
          marginBottom: '16px',
          color: colors.textPrimary,
        }}>
          Executive Summary
        </h2>
        <p style={{
          fontSize: '15px',
          lineHeight: '1.7',
          marginBottom: '32px',
          color: colors.textSecondary,
        }}>
          Your AI agents spent <span style={{ color: colors.textPrimary, fontWeight: '600', fontFamily: 'IBM Plex Mono, monospace' }}>${reportData.totalSpend.toLocaleString()}</span> this month with <span style={{ color: colors.accentGreen, fontWeight: '600', fontFamily: 'IBM Plex Mono, monospace' }}>${reportData.valueGenerated.toLocaleString()}</span> in estimated value generated. Overall ROI multiple: <span style={{ color: colors.accentGreen, fontWeight: '600', fontFamily: 'IBM Plex Mono, monospace' }}>{reportData.roiMultiple.toFixed(2)}×</span>. {reportData.problematicAgent && 'One agent requires immediate attention.'}
        </p>

        {reportData.problematicAgent && (
          <div style={{
            background: '#fef2f2',
            border: `1px solid ${colors.dangerRed}`,
            borderRadius: '8px',
            padding: '20px',
            marginTop: '24px',
          }}>
            <h3 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '8px',
              color: colors.dangerRed,
            }}>
              ⚠️ Top Recommendation
            </h3>
            <p style={{
              fontSize: '14px',
              color: colors.dangerRed,
              lineHeight: '1.6',
            }}>
              <strong>Review the {reportData.problematicAgent.name} agent</strong> — It has spent <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>${reportData.problematicAgent.cost.toLocaleString()}</span> with <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{reportData.problematicAgent.roi.toFixed(1)}× ROI</span>. Estimated monthly savings if optimized: <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>${reportData.estimatedSavings.toLocaleString()}</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
