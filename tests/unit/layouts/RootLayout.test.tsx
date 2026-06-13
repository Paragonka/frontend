import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RootLayout } from '@/layouts/RootLayout'
import { useAuthStore } from '@/shared/store/auth'

vi.mock('@/features/orgs/hooks/useOrgs', () => ({
  useOrgs: () => ({ data: undefined, isLoading: false }),
}))

const testUser = { id: '1', email: 'test@test.com', full_name: 'Test User' }

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/app/:orgId?" element={<RootLayout />}>
            <Route index element={<div>Dashboard content</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/orgs/select" element={<div>Org selection page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RootLayout', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useAuthStore.setState({ user: null, currentOrgId: null })
  })

  it('redirects to /login when not authenticated', () => {
    renderAt('/app/org-1')

    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('redirects to /orgs/select when authenticated without org in URL or store', () => {
    useAuthStore.setState({ user: testUser, currentOrgId: null })
    renderAt('/app')

    expect(screen.getByText('Org selection page')).toBeInTheDocument()
  })

  it('renders sidebar, navbar and outlet when authenticated with org', () => {
    useAuthStore.setState({ user: testUser, currentOrgId: 'org-1' })
    renderAt('/app/org-1')

    expect(screen.getByText('Paragonka CRM')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
  })

  it('syncs a different :orgId from the URL into the store', async () => {
    useAuthStore.setState({ user: testUser, currentOrgId: 'org-1' })
    renderAt('/app/org-2')

    await waitFor(() => {
      expect(useAuthStore.getState().currentOrgId).toBe('org-2')
    })
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
  })

  it('recovers from an empty store when the URL carries :orgId instead of redirecting', async () => {
    useAuthStore.setState({ user: testUser, currentOrgId: null })
    renderAt('/app/org-9')

    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
    await waitFor(() => {
      expect(useAuthStore.getState().currentOrgId).toBe('org-9')
    })
  })

  it('keeps the store value when it already matches the URL param', () => {
    useAuthStore.setState({ user: testUser, currentOrgId: 'org-1' })
    renderAt('/app/org-1')

    expect(useAuthStore.getState().currentOrgId).toBe('org-1')
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
  })
})
