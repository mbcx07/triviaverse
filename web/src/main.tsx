import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register PWA service worker for offline support & install prompt
registerSW({
  onRegistered(r) {
    console.log('[PWA] Service worker registered:', r)
  },
  onRegisterError(e) {
    console.warn('[PWA] SW registration failed:', e)
  },
})
