import React, { useState, useEffect, lazy, Suspense } from 'react'
import Landing from './pages/Landing'
import { usePageTitle } from './hooks/usePageTitle'
import { DashboardSidebar } from './screens/components/DashboardSidebar'
import { DashboardTopBar } from './screens/components/DashboardTopBar'
import { UpgradeModal } from './components/UpgradeModal'
import './styles/designSystem.css'
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
    return <DarkDashboard currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} screenNames={screenNames} isMobile={isMobile} />
  }

  // Default: show dashboard
  return <DarkDashboard currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} screenNames={screenNames} isMobile={isMobile} />
}

class ErrorBoundaryDark extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('Dashboard error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: 'white' }}>
          <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '28px', marginBottom: '16px' }}>Something went wrong</h2>
          <pre style={{ background: '#151515', padding: '16px', borderRadius: '8px', overflow: 'auto', fontSize: '13px', color: '#ef4444' }}>
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button onClick={() => window.location.reload()} style={{
            marginTop: '16px', padding: '10px 20px', background: '#22c55e', color: '#050505',
            borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer',
          }}>Reload page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy imports OUTSIDE component to prevent remount on every render
const DashScreens = {
  overview: lazy(() => import('./screens/Overview')),
  agents: lazy(() => import('./screens/Agents')),
  budget: lazy(() => import('./screens/Budget')),
  report: lazy(() => import('./screens/Report')),
  onboarding: lazy(() => import('./screens/Onboarding')),
  outreach: lazy(() => import('./screens/Outreach')),
  admin: lazy(() => import('./screens/Admin')),
};

function DarkDashboard({ currentScreen, setCurrentScreen, screenNames, isMobile }) {
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [org, setOrg] = useState(() => JSON.parse(localStorage.getItem('layeroi_org') || 'null'));

  // Listen for TopBar menu navigation events
  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail;
      if (typeof detail === 'string') {
        setCurrentScreen(detail);
      } else if (detail?.screen) {
        setCurrentScreen(detail.screen);
        if (detail.tab) {
          window.sessionStorage.setItem('admin_tab_target', detail.tab);
        }
      }
    };
    window.addEventListener('navigate-screen', handler);
    return () => window.removeEventListener('navigate-screen', handler);
  }, [setCurrentScreen]);

  // Refresh org data on mount
  useEffect(() => {
    const token = localStorage.getItem('layeroi_token');
    if (!token) return;
    fetch('https://api.layeroi.com/payments/status', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const fresh = { ...(org || {}), ...data.data };
          localStorage.setItem('layeroi_org', JSON.stringify(fresh));
          setOrg(fresh);
        }
      }).catch(() => {});
  }, []);

  // Handle ?payment=success return from Dodo checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const plan = params.get('plan') || 'starter';
      // Update org in localStorage immediately for sidebar refresh
      const updatedOrg = { ...(org || {}), plan, plan_agent_limit: plan === 'enterprise' ? -1 : plan === 'business' ? 30 : 5 };
      localStorage.setItem('layeroi_org', JSON.stringify(updatedOrg));
      setOrg(updatedOrg);
      // Clean URL
      window.history.replaceState({}, '', '/dashboard');
      // Also refetch from server to get accurate data
      const token = localStorage.getItem('layeroi_token');
      if (token) {
        fetch('https://api.layeroi.com/payments/status', { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => r.json())
          .then(data => {
            if (data.success && data.data) {
              const serverOrg = { ...(org || {}), ...data.data };
              localStorage.setItem('layeroi_org', JSON.stringify(serverOrg));
              setOrg(serverOrg);
            }
          }).catch(() => {});
      }
    }
  }, []);

  const CurrentScreen = DashScreens[currentScreen] || DashScreens.overview;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black, #050505)', color: 'white', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Sidebar — desktop */}
      {sidebarOpen && !isMobile && (
        <DashboardSidebar active={currentScreen} onNavigate={setCurrentScreen} onUpgrade={() => setUpgradeOpen(true)} />
      )}

      {/* Sidebar — mobile overlay */}
      {sidebarOpen && isMobile && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
            <DashboardSidebar active={currentScreen} onNavigate={setCurrentScreen} onUpgrade={() => setUpgradeOpen(true)} onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main */}
      <div style={{
        marginLeft: sidebarOpen && !isMobile ? '232px' : 0,
        transition: 'margin-left 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
      }}>
        <DashboardTopBar onToggleSidebar={() => setSidebarOpen(o => !o)} screenName={screenNames[currentScreen] || 'Dashboard'} />
        <main style={{ flex: 1, padding: isMobile ? '24px 16px' : '40px 48px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
          <ErrorBoundaryDark>
            <Suspense fallback={<div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--white-55, rgba(255,255,255,0.55))' }}>Loading...</div>}>
              <CurrentScreen />
            </Suspense>
          </ErrorBoundaryDark>
        </main>
      </div>

      <UpgradeModal isOpen={upgradeOpen} onClose={() => {
        setUpgradeOpen(false);
        // Refresh org after modal close in case plan changed
        setOrg(JSON.parse(localStorage.getItem('layeroi_org') || 'null'));
      }} currentPlan={org?.plan || 'free'} />
    </div>
  );

}
