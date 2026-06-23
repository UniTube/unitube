import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import App from './App'
// vite-plugin-pwa generates this virtual module at build time.
// It auto-registers the service worker produced by Workbox and handles update lifecycle.
import { registerSW } from 'virtual:pwa-register'

// Register the service worker. onNeedRefresh is called when a new version is available.
registerSW({
  onNeedRefresh() {
    // A new version is available — the autoUpdate strategy will handle reloading silently.
  },
  onOfflineReady() {
    console.log('[PWA] App is ready to work offline')
  },
  onRegisterError(error) {
    console.error('[PWA] Service worker registration failed:', error)
  },
})

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
