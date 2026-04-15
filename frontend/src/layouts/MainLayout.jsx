import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useResponsive } from '../hooks/useResponsive';
import { theme } from '../styles/theme';

export default function MainLayout({ children, active, isActive }) {
  const { isMobile, isTabletUp, isDesktopUp } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Calculate dynamic margins and padding based on breakpoints
  const mainMarginLeft = isMobile ? 0 : isTabletUp ? '64px' : '256px';
  const mainMarginTop = '60px';
  const mainPadding = isMobile ? '16px' : isTabletUp ? '24px' : '32px';

  // Handle sidebar toggle for mobile
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div
      className="main-layout"
      style={{
        background: theme.colors.bg,
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: isDesktopUp ? '256px 1fr' : isTabletUp ? '64px 1fr' : '1fr',
        gridTemplateRows: 'auto 1fr',
      }}
    >
      {/* Sidebar - hidden on mobile */}
      {!isMobile && (
        <div
          style={{
            gridColumn: '1',
            gridRow: '1 / 3',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <Sidebar active={active} />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 30,
          }}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100vh',
              width: '256px',
              background: theme.colors.bg,
              boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Sidebar active={active} />
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div
        style={{
          gridColumn: isDesktopUp ? '2' : '1',
          gridRow: '1',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <TopBar
          isActive={isActive}
          onMenuToggle={handleSidebarToggle}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
        />
      </div>

      {/* Main Content */}
      <main
        className="main-content"
        style={{
          gridColumn: isDesktopUp ? '2' : '1',
          gridRow: '2',
          marginTop: mainMarginTop,
          padding: mainPadding,
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        <div className="container" style={{ maxWidth: '100%' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
