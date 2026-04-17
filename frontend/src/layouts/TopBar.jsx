import { useResponsive } from '../hooks/useResponsive';
import { theme } from '../styles/theme';

export default function TopBar({ isActive, onMenuToggle, sidebarOpen, isMobile }) {
  const { isTabletUp, isDesktopUp } = useResponsive();
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  // Responsive margins and padding
  const marginLeft = isMobile ? 0 : isTabletUp ? '64px' : '256px';
  const horizontalPadding = isMobile ? '12px' : isTabletUp ? '16px' : '24px';
  const titleFontSize = isMobile ? '16px' : '20px';
  const dateFontSize = isMobile ? '10px' : '12px';

  return (
    <div
      className="top-bar"
      style={{
        height: '60px',
        background: theme.colors.card,
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: horizontalPadding,
        paddingRight: horizontalPadding,
        marginLeft: marginLeft,
        position: 'fixed',
        width: isDesktopUp ? `calc(100% - 256px)` : isTabletUp ? `calc(100% - 64px)` : '100%',
        top: 0,
        zIndex: 50,
        gap: isMobile ? '8px' : '16px',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Mobile Menu Button - visible on mobile */}
      {isMobile && (
        <button
          className="mobile-menu-button"
          onClick={() => onMenuToggle?.(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={sidebarOpen}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: theme.colors.text.primary,
            fontSize: '18px',
            minWidth: '48px',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
      )}

      {/* Title */}
      <h1
        style={{
          fontFamily: theme.fonts.serif,
          fontSize: titleFontSize,
          margin: 0,
          flex: isMobile ? 1 : 'auto',
          minWidth: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        layeroi
      </h1>

      {/* Date Range - hidden on mobile, shown on tablet and up */}
      {isTabletUp && (
        <span
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: dateFontSize,
            color: theme.colors.text.secondary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: isMobile ? '100px' : '200px',
          }}
        >
          {startOfWeek.toLocaleDateString()} — {endOfWeek.toLocaleDateString()}
        </span>
      )}

      {/* Status Indicator */}
      <div
        className="status-indicator"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginLeft: 'auto',
        }}
      >
        {isTabletUp && (
          <span
            style={{
              fontSize: dateFontSize,
              color: theme.colors.text.secondary,
              whiteSpace: 'nowrap',
            }}
          >
            System
          </span>
        )}
        <div
          style={{
            width: '8px',
            height: '8px',
            background: isActive ? theme.colors.accent : theme.colors.danger,
            borderRadius: '50%',
            animation: isActive ? 'pulse 2s infinite' : 'none',
            flexShrink: 0,
          }}
          aria-label={isActive ? 'System active' : 'System inactive'}
        />
      </div>
    </div>
  );
}
