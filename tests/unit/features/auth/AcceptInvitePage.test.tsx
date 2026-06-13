import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AcceptInvitePage } from '@/features/auth/components/AcceptInvitePage'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { ApiError } from '@/shared/api/errors'
import { useAuthStore } from '@/shared/store/auth'

const mockAcceptInvite = vi.hoisted(() => vi.fn())
const mockLogin = vi.hoisted(() => vi.fn())

vi.mock('@/features/auth/api', () => ({
  acceptInvite: mockAcceptInvite,
  login: mockLogin,
}))

function LocationProbe({ label }: { label: string }) {
  const location = useLocation()
  return (
    <div data-testid="probe">
      {label}|{location.pathname}
      {location.search ? `?${location.search.slice(1)}` : ''}|{JSON.stringify(location.state)}
    </div>
  )
}

function renderAt(path: string, state?: unknown) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[state === undefined ? path : { pathname: path, state }]}>
        <Routes>
          <Route path="/invite" element={<AcceptInvitePage />} />
          <Route path="/app/:orgId" element={<div>ORG PAGE</div>} />
          <Route
            path="/login"
            element={
              <>
                <LoginPage />
                <LocationProbe label="LOGIN" />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AcceptInvitePage', () => {
  beforeEach(() => {
    mockAcceptInvite.mockReset()
    mockLogin.mockReset()
    useAuthStore.setState({ user: null, currentOrgId: null })
  })

  it('shows alert when token is missing', () => {
    renderAt('/invite')

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid invite link')
    expect(mockAcceptInvite).not.toHaveBeenCalled()
  })

  it('redirects guests to /login keeping the invite link in state', () => {
    renderAt('/invite?token=tok-123')

    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    const probe = screen.getByTestId('probe')
    // guest is sent to /login; the original invite path rides along in location.state.from
    expect(probe).toHaveTextContent('LOGIN|/login')
    expect(probe).toHaveTextContent('/invite?token=tok-123')
    expect(mockAcceptInvite).not.toHaveBeenCalled()
  })

  it('accepts the invitation for a logged-in user and navigates to the org', async () => {
    useAuthStore.setState({
      user: { id: 'u1', email: 'a@t.io', full_name: 'Alice' },
      currentOrgId: null,
    })
    mockAcceptInvite.mockResolvedValue({ org_id: 'org-9', org_name: 'Joined Org', role: 'member' })

    renderAt('/invite?token=tok-123')

    await waitFor(
      () => {
        expect(mockAcceptInvite).toHaveBeenCalledWith({ token: 'tok-123' })
        expect(screen.getByText('ORG PAGE')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
    expect(useAuthStore.getState().currentOrgId).toBe('org-9')
  })

  it('shows an error for an expired invitation', async () => {
    useAuthStore.setState({
      user: { id: 'u1', email: 'a@t.io', full_name: 'Alice' },
      currentOrgId: null,
    })
    mockAcceptInvite.mockRejectedValue(new ApiError(410, 'EXPIRED', 'gone'))

    renderAt('/invite?token=tok-expired')

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('This invitation has expired.')
    })
    expect(screen.queryByText('ORG PAGE')).not.toBeInTheDocument()
  })

  it('continues invite acceptance after login', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({
      access_token: 'a',
      refresh_token: 'r',
      token_type: 'bearer',
      user: { id: 'u1', email: 'a@t.io', full_name: 'Alice' },
    })
    mockAcceptInvite.mockResolvedValue({ org_id: 'org-9', org_name: 'Joined Org', role: 'member' })

    // /login carries { from: '/invite?token=...' } — exactly what AcceptInvitePage sets
    renderAt('/login', { from: '/invite?token=tok-123' })

    await user.type(screen.getByPlaceholderText('Email'), 'alice@test.com')
    await user.type(screen.getByPlaceholderText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      // TanStack Query v5 passes a mutation-context 2nd arg to mutationFn — check only credentials
      expect(mockLogin).toHaveBeenCalledTimes(1)
      const [firstLoginCall] = mockLogin.mock.calls
      expect(firstLoginCall?.[0]).toEqual({ email: 'alice@test.com', password: 'secret123' })
      expect(mockAcceptInvite).toHaveBeenCalledWith({ token: 'tok-123' })
      expect(screen.getByText('ORG PAGE')).toBeInTheDocument()
    })
    expect(useAuthStore.getState().currentOrgId).toBe('org-9')
  }, 10000)
})
