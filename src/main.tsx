import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { prefetchTiered, runWhenIdle } from '@/app/prefetch'
import App from './App.tsx'

async function startApp() {
  // MSW is dev-only: import.meta.env.DEV is statically replaced with `false`
  // in production builds, so this branch (and the msw chunk) is dropped.
  if (import.meta.env.DEV && import.meta.env.VITE_MSW_ENABLED === 'true') {
    const { worker } = await import('../tests/mocks/browser.ts')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }

  const rootEl = document.getElementById('root')
  if (!rootEl) throw new Error('Root element not found')
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

async function warmLazyCache() {
  const reg = await navigator.serviceWorker.getRegistration()
  reg?.active?.postMessage('WARM_LAZY')
}

window.addEventListener('load', () => {
  setTimeout(() => {
    runWhenIdle(() => {
      warmLazyCache()
    })
  }, 15000)
})

startApp()

prefetchTiered([
  () => import('@/features/auth/components/LoginPage'),
  () => import('@/features/orgs/components/OrgSelectPage'),
])
