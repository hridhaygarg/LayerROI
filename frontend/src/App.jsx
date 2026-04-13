import { useState, useEffect } from 'react'
import Sidebar from './layouts/Sidebar'
import Overview from './screens/Overview'
import Agents from './screens/Agents'
import Budget from './screens/Budget'
import Report from './screens/Report'
import Onboarding from './screens/Onboarding'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Landing from './pages/Landing'

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

  const screens = {
    overview: Overview,
    agents: Agents,
    budget: Budget,
    report: Report,
    onboarding: Onboarding,
  }

  const CurrentScreen = screens[currentScreen] || Overview
  const screenNames = {
    overview: 'Overview',
    agents: 'Agents',
    budget: 'Budget',
    report: 'Reports',
    onboarding: 'Onboarding',
  }

  // Show landing page if on root
  if (currentPath === '/' || currentPath === '') {
    return <Landing />
  }

  // Show signup page if on /signup route
  if (currentPath === '/signup') {
    return <Signup onSuccess={() => window.location.href = '/dashboard'} />
  }

  // Show login page if on /login route
  if (currentPath === '/login') {
    return <Login />
  }

  // Check authentication for dashboard routes
  const isDashboard = currentPath === '/dashboard' || currentPath.startsWith('/dashboard')
  if (isDashboard && !localStorage.getItem('layeroi_token')) {
    window.location.href = '/login'
    return null
  }

  // Dashboard layout for /dashboard and all dashboard routes
  if (isDashboard) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bgPrimary, fontFamily: 'Inter, sans-serif' }}>
        {/* Sidebar */}
        <Sidebar active={currentScreen} onNavigate={setCurrentScreen} colors={colors} />

        {/* Main content */}
        <div style={{ flex: 1, marginLeft: '240px' }}>
          {/* Top bar */}
          <div style={{
            height: '64px',
            background: colors.bgSurface,
            borderBottom: `1px solid ${colors.borderDefault}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 40px',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: colors.shadowSm,
          }}>
            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '20px',
              fontWeight: '600',
              color: colors.textPrimary,
            }}>
              {screenNames[currentScreen] || 'Dashboard'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '12px', color: colors.textTertiary, fontFamily: 'IBM Plex Mono, monospace' }}>
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: isProxyActive ? colors.accentGreen : '#dc2626',
                  borderRadius: '50%',
                  animation: isProxyActive ? 'pulse 2s infinite' : 'none',
                }} />
                <span style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: 'IBM Plex Mono, monospace' }}>
                  {isProxyActive ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <main style={{ padding: '40px', minHeight: 'calc(100vh - 64px)' }}>
            <CurrentScreen />
          </main>
        </div>
      </div>
    )
  }

  // Default to dashboard
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bgPrimary, fontFamily: 'Inter, sans-serif' }}>
      <Sidebar active={currentScreen} onNavigate={setCurrentScreen} colors={colors} />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <div style={{
          height: '64px',
          background: colors.bgSurface,
          borderBottom: `1px solid ${colors.borderDefault}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: colors.shadowSm,
        }}>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '20px',
            fontWeight: '600',
            color: colors.textPrimary,
          }}>
            {screenNames[currentScreen] || 'Dashboard'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: colors.textTertiary, fontFamily: 'IBM Plex Mono, monospace' }}>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: isProxyActive ? colors.accentGreen : '#dc2626',
                borderRadius: '50%',
                animation: isProxyActive ? 'pulse 2s infinite' : 'none',
              }} />
              <span style={{ fontSize: '11px', color: colors.textSecondary, fontFamily: 'IBM Plex Mono, monospace' }}>
                {isProxyActive ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        <main style={{ padding: '40px', minHeight: 'calc(100vh - 64px)' }}>
          <CurrentScreen />
        </main>
      </div>
    </div>
  )
}
