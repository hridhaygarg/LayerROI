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

// Preload critical fonts
const preloadLink = document.createElement('link')
preloadLink.rel = 'preload'
preloadLink.as = 'style'
preloadLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap'
document.head.appendChild(preloadLink)

// Preconnect to font CDN for faster loading
const preconnect = document.createElement('link')
preconnect.rel = 'preconnect'
preconnect.href = 'https://fonts.googleapis.com'
document.head.appendChild(preconnect)

const preconnectGstatic = document.createElement('link')
preconnectGstatic.rel = 'preconnect'
preconnectGstatic.href = 'https://fonts.gstatic.com'
preconnectGstatic.crossOrigin = 'anonymous'
document.head.appendChild(preconnectGstatic)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
// cache bust
