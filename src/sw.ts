/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import {
  addRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  type PrecacheEntry,
  precache,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

const manifest = self.__WB_MANIFEST as PrecacheEntry[]

// Everything except the heavy FinanceDashboard (Recharts ~342KB) is precached
// at install, so in-app pages (calendar, lists, forms) are served from cache
// on first visit. FinanceDashboard is warmed lazily via WARM_LAZY.
const isCritical = (entry: PrecacheEntry): boolean => {
  return !entry.url.includes('FinanceDashboard')
}

const critical = manifest.filter(isCritical)
const rest = manifest.filter((e) => !critical.includes(e))

precache(critical)
addRoute()
cleanupOutdatedCaches()

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api\//, /^\/admin\//],
  }),
)

// API GETs offline-first, but bounded: auth endpoints (sessions etc.) are
// never cached so one user's data cannot leak to another session on a shared
// device, and the cache expires so it cannot grow unbounded.
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/v1/auth/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 })],
  }),
  'GET',
)

registerRoute(
  /\/assets\/.*\.(js|css)$/i,
  new CacheFirst({
    cacheName: 'lazy-chunks',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
  'GET',
)

self.addEventListener('message', (event) => {
  if (event.data === 'WARM_LAZY') {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open(`workbox-precache-v2-${self.location.origin}/`)
          await cache.addAll(rest.map((e) => e.url))
          const clients = await self.clients.matchAll()
          for (const client of clients) {
            client.postMessage('WARM_DONE')
          }
        } catch (err) {
          const clients = await self.clients.matchAll()
          for (const client of clients) {
            client.postMessage(`WARM_ERROR: ${(err as Error).message}`)
          }
        }
      })(),
    )
  }
})
