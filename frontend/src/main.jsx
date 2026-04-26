import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles/responsive.css'
import './styles/institutional.css'
import './styles/accessibility.css'
import './styles/premium-design-system.css'
import './styles/animations.css'
import './index.css'
import { ToastProvider } from './components/Toast'
import { ThemeProvider } from './theme/ThemeContext'
import { optimizeFontLoading, optimizeConnections, lazyLoadImages } from './utils/performance'

// Preload critical fonts
const preloadLink = document.createElement('link')
preloadLink.rel = 'preload'
preloadLink.as = 'style'
preloadLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap'
document.head.appendChild(preloadLink)

// Optimize performance
optimizeFontLoading()
optimizeConnections()

// Lazy load images when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    lazyLoadImages()
  })
} else {
  lazyLoadImages()
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
// cache bust
