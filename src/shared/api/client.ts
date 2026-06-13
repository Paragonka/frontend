import axios from 'axios'
import { useAuthStore } from '@/shared/store/auth'
import { ApiError } from './errors'

export const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

const WRITE_METHODS = ['post', 'put', 'patch', 'delete'] as const

// --- Cache-busting ---------------------------------------------------------
// Appends a `_t` timestamp to GET requests targeting endpoints whose data
// changes infrequently (org settings, EAV attribute schemas, user sessions).
// This prevents the browser HTTP cache from serving stale responses and forces
// Workbox's NetworkFirst handler to actually reach the network.
// Frequently-changing lists (orders, clients, products, receipts) are NOT
// bust-processed - Workbox SW handles those well with NetworkFirst.
const CACHE_BUST_PATTERNS: RegExp[] = [
  /^\/orgs$/, // user's organisation list
  /^\/orgs\/[^/]+\/settings$/, // org settings
  /^\/orgs\/[^/]+\/members$/, // org members
  /^\/orgs\/[^/]+\/invites$/, // org invites
  /^\/eav\/attributes$/, // EAV attribute definitions
  /^\/auth\/sessions$/, // session list
]

function shouldCacheBust(url: string): boolean {
  // Strip baseURL prefix if present - match on the path part only
  let path: string
  if (url.startsWith('http')) {
    path = new URL(url).pathname
  } else {
    path = url.split('?')[0] ?? url
  }
  return CACHE_BUST_PATTERNS.some((re) => re.test(path))
}

// Single-flight refresh: concurrent 401s must trigger only ONE POST /auth/refresh,
// otherwise refresh-token rotation (which invalidates the used token) would make
// the other in-flight requests replay an already-rotated token and log the user out.
let refreshPromise: Promise<boolean> | null = null

function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_URL}/auth/refresh`)
      .then(() => true)
      .catch(() => {
        useAuthStore.getState().logout()
        return false
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

apiClient.interceptors.request.use((config) => {
  // --- Offline guard (writes) ---
  if (
    WRITE_METHODS.includes(config.method?.toLowerCase() as (typeof WRITE_METHODS)[number]) &&
    !navigator.onLine
  ) {
    return Promise.reject(
      new ApiError(
        0,
        'OFFLINE',
        'You are offline. Create, update, and delete operations are unavailable.',
      ),
    )
  }

  // --- Cache-busting for infrequently-changing GET endpoints ---
  if (config.method?.toLowerCase() === 'get') {
    const url = config.url ?? ''
    if (shouldCacheBust(url)) {
      config.params = { ...config.params, _t: Date.now() }
    }
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const isAuthEndpoint =
      originalRequest?.url != null &&
      (originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/auth/register') ||
        originalRequest.url.includes('/auth/logout') ||
        originalRequest.url.includes('/auth/forgot-password') ||
        originalRequest.url.includes('/auth/reset-password'))

    const PUBLIC_ENDPOINTS = ['/consent/cookie', '/consent/policy']
    const isPublicEndpoint =
      originalRequest?.url != null &&
      PUBLIC_ENDPOINTS.some((ep) => originalRequest.url.includes(ep))

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint &&
      !isPublicEndpoint
    ) {
      originalRequest._retry = true

      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return apiClient(originalRequest)
      }
      window.location.href = '/login'
      return Promise.reject(error)
    }

    const detail = error.response?.data?.detail

    let message: string
    if (Array.isArray(detail)) {
      message = detail.map((d) => d.msg ?? d.message ?? d).join(', ')
    } else if (typeof detail === 'string' && detail.length > 0) {
      message = detail
    } else {
      message = error.message ?? 'Unknown error'
    }

    const apiError = new ApiError(
      error.response?.status ?? 500,
      error.response?.data?.code ?? 'UNKNOWN',
      message,
    )

    return Promise.reject(apiError)
  },
)
