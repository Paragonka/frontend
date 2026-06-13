import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionsSection } from '@/features/auth/components/SessionsSection'
import { ApiError } from '@/shared/api/errors'
import { formatDate } from '@/shared/lib/format'

const mockSessions = [
  {
    id: 's1',
    created_at: '2026-08-20T09:30:00Z',
    expires_at: '2026-09-19T09:30:00Z',
    last_used_at: null,
    ip: '192.168.0.10',
    user_agent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/126.0 Safari/537.36',
    is_current: true,
  },
  {
    id: 's2',
    created_at: '2026-08-01T09:30:00Z',
    expires_at: '2026-08-31T09:30:00Z',
    last_used_at: null,
    ip: '10.0.0.8',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1',
    is_current: false,
  },
]

let sessionsData = mockSessions
let listError: unknown = null
let revokeError: unknown = null

const mockRevokeMutate = vi.fn()
const mockRevokeAllMutate = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuthSessions: () => ({ data: sessionsData, isLoading: false, error: listError }),
  useRevokeSession: () => ({ mutate: mockRevokeMutate, isPending: false, error: revokeError }),
  useRevokeAllSessions: () => ({ mutate: mockRevokeAllMutate, isPending: false, error: null }),
  useLogout: () => mockSignOut,
}))

describe('SessionsSection', () => {
  beforeEach(() => {
    sessionsData = mockSessions
    listError = null
    revokeError = null
    mockRevokeMutate.mockClear()
    mockRevokeAllMutate.mockClear()
    mockSignOut.mockClear()
  })

  it('renders active sessions with ip, truncated user agent and created date', () => {
    render(<SessionsSection />)

    const rows = screen.getAllByTestId('session-row')
    expect(rows).toHaveLength(2)

    expect(within(rows[0] as HTMLElement).getByText('192.168.0.10')).toBeInTheDocument()
    expect(
      within(rows[0] as HTMLElement).getByText('Mozilla/5.0 (X11; Linux x86_64) Chrome/1…'),
    ).toBeInTheDocument()
    expect(
      within(rows[0] as HTMLElement).getByText(formatDate('2026-08-20T09:30:00Z')),
    ).toBeInTheDocument()
    expect(within(rows[1] as HTMLElement).getByText('10.0.0.8')).toBeInTheDocument()
  })

  it('marks the current session', () => {
    render(<SessionsSection />)

    const rows = screen.getAllByTestId('session-row')
    expect(within(rows[0] as HTMLElement).getByText('Current')).toBeInTheDocument()
    expect(within(rows[1] as HTMLElement).queryByText('Current')).not.toBeInTheDocument()
  })

  it('revokes another device session via the API', async () => {
    const user = userEvent.setup()
    render(<SessionsSection />)

    const rows = screen.getAllByTestId('session-row')
    await user.click(within(rows[1] as HTMLElement).getByRole('button', { name: 'Sign out' }))

    expect(mockRevokeMutate).toHaveBeenCalledWith('s2')
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  it('signs out directly when revoking the current session', async () => {
    const user = userEvent.setup()
    render(<SessionsSection />)

    const rows = screen.getAllByTestId('session-row')
    await user.click(within(rows[0] as HTMLElement).getByRole('button', { name: 'Sign out' }))

    expect(mockSignOut).toHaveBeenCalledTimes(1)
    expect(mockRevokeMutate).not.toHaveBeenCalled()
  })

  it('signs out everywhere via DELETE /sessions', async () => {
    const user = userEvent.setup()
    render(<SessionsSection />)

    await user.click(screen.getByRole('button', { name: 'Sign out everywhere' }))

    expect(mockRevokeAllMutate).toHaveBeenCalledTimes(1)
  })

  it('shows list load errors via role=alert', async () => {
    listError = new ApiError(500, 'UNKNOWN', 'Server error')

    render(<SessionsSection />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Server error')
    })
  })

  it('shows revoke errors via role=alert', async () => {
    revokeError = new ApiError(404, 'UNKNOWN', 'Session not found')

    render(<SessionsSection />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Session not found')
    })
  })

  it('shows an empty state when there are no sessions', () => {
    sessionsData = []

    render(<SessionsSection />)

    expect(screen.getByText('No active sessions')).toBeInTheDocument()
  })
})
