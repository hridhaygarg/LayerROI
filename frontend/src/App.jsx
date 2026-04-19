import { useState, useEffect, lazy, Suspense } from 'react'
import Sidebar from './layouts/Sidebar'
import Landing from './pages/Landing'
import { usePageTitle } from './hooks/usePageTitle'
import './styles/micro-interactions.css'
import './styles/print.css'

// Lazy load dashboard screens for better performance
const Overview = lazy(() => import('./screens/Overview'))
const Agents = lazy(() => import('./screens/Agents'))
const Budget = lazy(() => import('./screens/Budget'))
const Report = lazy(() => import('./screens/Report'))
const Onboarding = lazy(() => import('./screens/Onboarding'))
const Outreach = lazy(() => import('./screens/Outreach'))
const Admin = lazy(() => import('./screens/Admin'))
const Signup = lazy(() => import('./pages/Signup'))
const Login = lazy(() => import('./pages/Login'))
const Docs = lazy(() => import('./pages/Docs'))
const Blog = lazy(() => import('./pages/Blog'))
const SEOPages = lazy(() => import('./pages/SEOPages'))
const MagicLinkVerify = lazy(() => import('./pages/MagicLinkVerify'))

// Loading component
const LoadingScreen = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⟳</div>
      <p style={{ color: '#6b7280' }}>Loading...</p>
    </div>
  </div>
)

const colors = {
  bgPrimary: '#fafaf9',
  bgSurface: '#ffffff',
  bgSubtle: '#f5f5f4',
  borderDefault: 'rgba(0,0,0,0.08)',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  accentGreen: '#16a34a',
  shadowSm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 6px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('overview')
  const [isProxyActive, setIsProxyActive] = useState(false)
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Compute if this is a dashboard route
  const isDashboard = currentPath === '/dashboard' || currentPath.startsWith('/dashboard')

  const screenNames = {
    overview: 'Overview',
    agents: 'Agents',
    budget: 'Budget',
    report: 'Reports',
    onboarding: 'Onboarding',
    outreach: 'Outreach',
    admin: 'Admin',
  }

  // Set page title based on current screen
  usePageTitle(isDashboard ? screenNames[currentScreen] : 'layeroi')

  // Track page views in Google Analytics
  useEffect(() => {
    if (window.gtag) {
      window.gtag('config', 'G-BNYSXHQPSQ', {
        page_path: currentPath
      });
    }
  }, [currentPath])

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const checkProxy = async () => {
      try {
        const res = await fetch('https://api.layeroi.com/health')
        setIsProxyActive(res.ok)
      } catch {
        setIsProxyActive(false)
      }
    }
    checkProxy()
    const interval = setInterval(checkProxy, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const screens = {
    overview: Overview,
    agents: Agents,
    budget: Budget,
    report: Report,
    onboarding: Onboarding,
    outreach: Outreach,
    admin: Admin,
  }

  const CurrentScreen = screens[currentScreen] || Overview

  // Show landing page if on root
  if (currentPath === '/' || currentPath === '') {
    return <Landing />
  }

  // Show signup page if on /signup route
  if (currentPath === '/signup') {
    return <Suspense fallback={<LoadingScreen />}><Signup onSuccess={() => window.location.href = '/dashboard'} /></Suspense>
  }

  // Show login page if on /login route
  if (currentPath === '/login') {
    return <Suspense fallback={<LoadingScreen />}><Login /></Suspense>
  }

  // Magic link verification
  if (currentPath === '/auth/verify') {
    return <Suspense fallback={<LoadingScreen />}><MagicLinkVerify /></Suspense>
  }

  // Show docs page
  if (currentPath === '/docs' || currentPath.startsWith('/docs')) {
    return <Suspense fallback={<LoadingScreen />}><Docs /></Suspense>
  }

  // Show blog page
  if (currentPath === '/blog' || currentPath.startsWith('/blog')) {
    return <Suspense fallback={<LoadingScreen />}><Blog /></Suspense>
  }

  // SEO landing pages and comparison pages
  if (currentPath === '/ai-agent-cost-tracking' || currentPath === '/ai-agent-roi' || currentPath.startsWith('/vs/')) {
    return <Suspense fallback={<LoadingScreen />}><SEOPages path={currentPath} /></Suspense>
  }

  // Check authentication for dashboard routes
  if (isDashboard && !localStorage.getItem('layeroi_token')) {
    window.location.href = '/login'
    return null
  }

  // Dashboard layout for /dashboard and all dashboard routes
  if (isDashboard) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bgPrimary, fontFamily: 'Inter, sans-serif', flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        {!isMobile && <Sidebar active={currentScreen} onNavigate={setCurrentScreen} colors={colors} />}

        {/* Mobile Overlay for Menu */}
        {isMobile && isMobileMenuOpen && (
          <div
            style={{
              position: 'fixed',
              top: '64px',
              left: 0,
              right: 0,
              bottom: '64px',
              background: 'rgba(0,0,0,0.3)',
              zIndex: 39,
              animation: 'fadeIn 200ms cubic-bezier(0.16,1,0.3,1) both',
            }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu Drawer */}
        {isMobile && isMobileMenuOpen && (
          <div
            style={{
              position: 'fixed',
              top: '64px',
              left: 0,
              width: '240px',
              bottom: '64px',
              background: colors.bgSurface,
              borderRight: `1px solid ${colors.borderDefault}`,
              zIndex: 40,
              overflowY: 'auto',
              animation: 'slideInLeft 300ms cubic-bezier(0.16,1,0.3,1) both',
            }}
          >
            <Sidebar active={currentScreen} onNavigate={(screen) => { setCurrentScreen(screen); setIsMobileMenuOpen(false); }} colors={colors} />
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, marginLeft: isMobile ? '0' : '240px', marginBottom: isMobile ? '64px' : '0', display: 'flex', flexDirection: 'column' }}>
          {/* Top bar */}
          <div style={{
            height: '64px',
            background: colors.bgSurface,
            borderBottom: `1px solid ${colors.borderDefault}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 12px' : '0 40px',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: colors.shadowSm,
          }}>
            {isMobile && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: colors.textPrimary,
                  padding: '8px',
                  transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={(e) => e.target.style.background = colors.bgSubtle}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                ☰
              </button>
            )}
            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: isMobile ? '16px' : '20px',
              fontWeight: '600',
              color: colors.textPrimary,
              flex: 1,
              marginLeft: isMobile ? '12px' : '0',
            }}>
              {screenNames[currentScreen] || 'Dashboard'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
              {!isMobile && <span style={{ fontSize: '12px', color: colors.textTertiary, fontFamily: 'IBM Plex Mono, monospace' }}>
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: isProxyActive ? colors.accentGreen : '#dc2626',
                  borderRadius: '50%',
                  animation: isProxyActive ? 'pulse 2s infinite' : 'none',
                }} />
                {!isMobile && <span style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: 'IBM Plex Mono, monospace' }}>
                  {isProxyActive ? 'Live' : 'Offline'}
                </span>}
              </div>
            </div>
          </div>

          {/* Main content area */}
          <main style={{ padding: isMobile ? '20px' : '40px', minHeight: 'calc(100vh - 128px)', flex: 1 }}>
            <Suspense fallback={<LoadingScreen />}>
              <CurrentScreen />
            </Suspense>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '64px',
            background: colors.bgSurface,
            borderTop: `1px solid ${colors.borderDefault}`,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 60,
            boxShadow: `0 -2px 8px ${colors.shadowSm}`,
            animation: 'slideInUp 300ms cubic-bezier(0.16,1,0.3,1) both',
          }}>
            {Object.entries(screenNames).map(([key, name]) => (
              <button
                key={key}
                onClick={() => { setCurrentScreen(key); setIsMobileMenuOpen(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: currentScreen === key ? colors.accentGreen : colors.textSecondary,
                  fontSize: '11px',
                  fontWeight: currentScreen === key ? '600' : '500',
                  padding: '8px',
                  transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                  borderTop: currentScreen === key ? `3px solid ${colors.accentGreen}` : 'none',
                }}
                onMouseEnter={(e) => !e.currentTarget.style.borderTop && (e.currentTarget.style.color = colors.textPrimary)}
                onMouseLeave={(e) => !e.currentTarget.style.borderTop && (e.currentTarget.style.color = colors.textSecondary)}
              >
                <span style={{ fontSize: '16px', marginBottom: '2px' }}>
                  {key === 'overview' && '📊'}
                  {key === 'agents' && '🤖'}
                  {key === 'budget' && '💰'}
                  {key === 'report' && '📈'}
                  {key === 'onboarding' && '🚀'}
                  {key === 'outreach' && '🎯'}
                  {key === 'admin' && '⚙️'}
                </span>
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Default to dashboard
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bgPrimary, fontFamily: 'Inter, sans-serif', flexDirection: isMobile ? 'column' : 'row' }}>
      {/* Sidebar - Hidden on mobile */}
      {!isMobile && <Sidebar active={currentScreen} onNavigate={setCurrentScreen} colors={colors} />}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            bottom: '64px',
            background: 'rgba(0,0,0,0.3)',
            zIndex: 39,
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      {isMobile && isMobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          width: '240px',
          bottom: '64px',
          background: colors.bgSurface,
          borderRight: `1px solid ${colors.borderDefault}`,
          zIndex: 40,
          overflowY: 'auto',
        }}>
          <Sidebar active={currentScreen} onNavigate={(screen) => { setCurrentScreen(screen); setIsMobileMenuOpen(false); }} colors={colors} />
        </div>
      )}

      <div style={{ flex: 1, marginLeft: isMobile ? '0' : '240px', marginBottom: isMobile ? '64px' : '0', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          height: '64px',
          background: colors.bgSurface,
          borderBottom: `1px solid ${colors.borderDefault}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 12px' : '0 40px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: colors.shadowSm,
        }}>
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: colors.textPrimary,
                padding: '8px',
              }}
            >
              ☰
            </button>
          )}
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: isMobile ? '16px' : '20px',
            fontWeight: '600',
            color: colors.textPrimary,
            flex: 1,
            marginLeft: isMobile ? '12px' : '0',
          }}>
            {screenNames[currentScreen] || 'Dashboard'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
            {!isMobile && <span style={{ fontSize: '12px', color: colors.textTertiary, fontFamily: 'IBM Plex Mono, monospace' }}>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: isProxyActive ? colors.accentGreen : '#dc2626',
                borderRadius: '50%',
                animation: isProxyActive ? 'pulse 2s infinite' : 'none',
              }} />
              {!isMobile && <span style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: 'IBM Plex Mono, monospace' }}>
                {isProxyActive ? 'Live' : 'Offline'}
              </span>}
            </div>
          </div>
        </div>
        <main style={{ padding: isMobile ? '20px' : '40px', minHeight: 'calc(100vh - 128px)', flex: 1 }}>
          <Suspense fallback={<LoadingScreen />}>
            <CurrentScreen />
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          background: colors.bgSurface,
          borderTop: `1px solid ${colors.borderDefault}`,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 60,
        }}>
          {Object.entries(screenNames).filter(([key]) => key !== 'admin').map(([key, name]) => (
            <button
              key={key}
              onClick={() => { setCurrentScreen(key); setIsMobileMenuOpen(false); }}
              style={{
                background: 'none',
                border: 'none',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: currentScreen === key ? colors.accentGreen : colors.textSecondary,
                fontSize: '11px',
                fontWeight: currentScreen === key ? '600' : '500',
                padding: '8px',
                borderTop: currentScreen === key ? `3px solid ${colors.accentGreen}` : 'none',
              }}
            >
              <span style={{ fontSize: '16px', marginBottom: '2px' }}>
                {key === 'overview' && '📊'}
                {key === 'agents' && '🤖'}
                {key === 'budget' && '💰'}
                {key === 'report' && '📈'}
                {key === 'onboarding' && '🚀'}
                {key === 'outreach' && '🎯'}
              </span>
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
