import { Home, BarChart3, Settings, Users, FileText, Target, Lock } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';

export default function Sidebar({ active, onNavigate, colors }) {
  const { isMobile, isTabletUp, isDesktopUp } = useResponsive();

  const items = [
    { icon: Home, label: 'Overview', id: 'overview' },
    { icon: Users, label: 'Agents', id: 'agents' },
    { icon: BarChart3, label: 'Budget', id: 'budget' },
    { icon: FileText, label: 'Reports', id: 'report' },
    { icon: Target, label: 'Outreach', id: 'outreach' },
    { icon: Settings, label: 'Onboarding', id: 'onboarding' },
    { icon: Lock, label: 'Admin', id: 'admin' },
  ];

  // Responsive dimensions
  const sidebarWidth = isDesktopUp ? '256px' : isTabletUp ? '64px' : '0';
  const iconSize = isDesktopUp ? 20 : 18;
  const showLabel = isDesktopUp;
  const padding = isDesktopUp ? '24px 16px' : isTabletUp ? '16px 8px' : '0';

  // Don't render sidebar on mobile
  if (isMobile) {
    return null;
  }

  return (
    <nav
      className="sidebar"
      style={{
        width: sidebarWidth,
        background: colors.bgSurface,
        borderRight: `1px solid ${colors.borderDefault}`,
        display: 'flex',
        flexDirection: 'column',
        padding: padding,
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 100,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width 0.3s ease, padding 0.3s ease',
      }}
    >
      {/* Logo - only visible on desktop */}
      {showLabel && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: `1px solid ${colors.borderDefault}`,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              background: colors.accentGreen,
              borderRadius: '50%',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '16px',
              fontWeight: '600',
              color: colors.textPrimary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Layer ROI
          </span>
        </div>
      )}

      {/* Navigation items */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isDesktopUp ? '4px' : '8px',
          flex: 1,
        }}
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate?.(item.id)}
            title={!showLabel ? item.label : undefined}
            aria-label={item.label}
            style={{
              width: '100%',
              padding: isDesktopUp ? '12px 12px' : '12px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isDesktopUp ? 'flex-start' : 'center',
              gap: isDesktopUp ? '12px' : '0',
              border: 'none',
              background: active === item.id ? colors.bgSubtle : 'transparent',
              color: active === item.id ? colors.accentGreen : colors.textSecondary,
              cursor: 'pointer',
              transition: 'all 200ms ease',
              borderLeft: active === item.id ? `4px solid ${colors.accentGreen}` : '4px solid transparent',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: active === item.id ? '600' : '500',
              minHeight: '48px',
              minWidth: '48px',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (active !== item.id) {
                e.target.style.background = colors.bgSubtle;
              }
            }}
            onMouseLeave={(e) => {
              if (active !== item.id) {
                e.target.style.background = 'transparent';
              }
            }}
          >
            <item.icon
              size={iconSize}
              style={{
                flexShrink: 0,
              }}
            />
            {showLabel && (
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
