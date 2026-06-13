import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { useCurrency } from '@/features/orgs/hooks/useCurrency'
import { useAuthStore } from '@/shared/store/auth'
import { server } from '../../../mocks/server'

const testUser = { id: 'u1', email: 'test@test.com', full_name: 'Test User' }

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useCurrency', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useAuthStore.setState({ user: null, currentOrgId: null })
  })

  it('returns the org currency from GET /orgs/:id/settings', async () => {
    server.use(
      http.get('/api/v1/orgs/:orgId/settings', () => HttpResponse.json({ currency: 'EUR' })),
    )
    useAuthStore.setState({ user: testUser, currentOrgId: 'org-1' })

    const { result } = renderHook(() => useCurrency(), { wrapper: makeWrapper() })

    await waitFor(() => {
      expect(result.current).toBe('EUR')
    })
  })

  it('falls back to PLN while settings are unavailable without an org', async () => {
    const { result } = renderHook(() => useCurrency(), { wrapper: makeWrapper() })

    await waitFor(() => {
      expect(result.current).toBe('PLN')
    })
  })

  it('falls back to PLN when the settings request fails', async () => {
    server.use(
      http.get('/api/v1/orgs/:orgId/settings', () => new HttpResponse(null, { status: 500 })),
    )
    useAuthStore.setState({ user: testUser, currentOrgId: 'org-1' })

    const { result } = renderHook(() => useCurrency(), { wrapper: makeWrapper() })

    await waitFor(() => {
      expect(result.current).toBe('PLN')
    })
  })
})
