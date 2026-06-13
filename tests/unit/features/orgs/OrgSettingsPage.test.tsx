import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { OrgSettingsPage } from '@/features/orgs/components/OrgSettingsPage'
import { useAuthStore } from '@/shared/store/auth'

const mockMembers = [
  { user_id: 'u1', email: 'owner@test.com', full_name: 'Olga Owner', role: 'owner' },
  { user_id: 'u2', email: 'member@test.com', full_name: 'Marek Member', role: 'member' },
]

const mockInvites = [
  {
    invite_id: 'inv-1',
    email: 'newbie@test.com',
    token: 'tok-1',
    expires_at: '2026-12-31T00:00:00Z',
  },
]

let membersData = mockMembers
let removeMemberError: unknown = null

const mockCreateInviteMutate = vi.fn()
const mockRemoveMutate = vi.fn()
const mockRevokeMutate = vi.fn()
const mockUpdateSettingsMutate = vi.fn()
const mockUpdateOrgMutate = vi.fn()
const mockDeleteOrgMutate = vi.fn()

const mockOrgsData = [{ id: 'org-1', name: 'My Bakery', owner_id: 'u1', timezone: 'UTC' }]

vi.mock('@/features/orgs/hooks/useOrgs', () => ({
  useOrgs: () => ({ data: mockOrgsData, isLoading: false }),
  useOrgMembers: () => ({ data: membersData, isLoading: false }),
  useOrgInvites: () => ({ data: mockInvites, isLoading: false }),
  useCreateInvite: () => ({ mutate: mockCreateInviteMutate, isPending: false, error: null }),
  useRemoveMember: () => ({ mutate: mockRemoveMutate, isPending: false, error: removeMemberError }),
  useRevokeInvite: () => ({ mutate: mockRevokeMutate, isPending: false, error: null }),
  useOrgSettings: () => ({ data: { currency: 'PLN' }, isLoading: false }),
  useUpdateOrgSettings: () => ({
    mutate: mockUpdateSettingsMutate,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
  useUpdateOrg: () => ({ mutate: mockUpdateOrgMutate, isPending: false, isError: false }),
  useDeleteOrg: () => ({ mutate: mockDeleteOrgMutate, isPending: false, isError: false }),
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/app/org-1/settings']}>
        <Routes>
          <Route path="/app/:orgId/settings" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
  return writeText
}

describe('OrgSettingsPage', () => {
  beforeEach(() => {
    membersData = mockMembers
    removeMemberError = null
    mockCreateInviteMutate.mockClear()
    mockRemoveMutate.mockClear()
    mockRevokeMutate.mockClear()
    mockUpdateSettingsMutate.mockClear()
    mockUpdateOrgMutate.mockClear()
    mockDeleteOrgMutate.mockClear()
    useAuthStore.setState({
      user: { id: 'u1', email: 'owner@test.com', full_name: 'Olga Owner' },
      currentOrgId: 'org-1',
    })
  })

  it('renders members list with role badges', async () => {
    const user = userEvent.setup()
    render(<OrgSettingsPage />, { wrapper: Wrapper })
    await user.click(screen.getByRole('tab', { name: 'Members' }))

    expect(screen.getByText('owner@test.com')).toBeInTheDocument()
    expect(screen.getByText('member@test.com')).toBeInTheDocument()
    expect(screen.getByText('Olga Owner')).toBeInTheDocument()

    const rows = screen.getAllByTestId('member-row')
    expect(rows[0]).toHaveTextContent('Owner')
    expect(rows[1]).toHaveTextContent('Member')
  })

  it('hides Remove button for the current user but shows for others', async () => {
    const user = userEvent.setup()
    render(<OrgSettingsPage />, { wrapper: Wrapper })
    await user.click(screen.getByRole('tab', { name: 'Members' }))

    const rows = screen.getAllByTestId('member-row')
    expect(within(rows[0] as HTMLElement).queryByRole('button')).not.toBeInTheDocument()
    expect(
      within(rows[1] as HTMLElement).getByRole('button', { name: 'Remove' }),
    ).toBeInTheDocument()
  })

  it('calls removeMember on Remove click', async () => {
    const user = userEvent.setup()
    render(<OrgSettingsPage />, { wrapper: Wrapper })
    await user.click(screen.getByRole('tab', { name: 'Members' }))

    const rows = screen.getAllByTestId('member-row')
    await user.click(within(rows[1] as HTMLElement).getByRole('button', { name: 'Remove' }))

    expect(mockRemoveMutate).toHaveBeenCalledWith('u2')
  })

  it('shows removal error via role=alert', async () => {
    removeMemberError = new Error('Cannot remove the last owner')

    const user = userEvent.setup()
    render(<OrgSettingsPage />, { wrapper: Wrapper })
    await user.click(screen.getByRole('tab', { name: 'Members' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Cannot remove the last owner')
    })
  })

  it('invite form submits email to createInvite', async () => {
    const user = userEvent.setup()
    render(<OrgSettingsPage />, { wrapper: Wrapper })

    await user.click(screen.getByRole('tab', { name: 'Invitations' }))
    await user.type(screen.getByPlaceholderText('Email'), 'new@example.com')
    await user.click(screen.getByRole('button', { name: 'Invite' }))

    await waitFor(() => {
      expect(mockCreateInviteMutate).toHaveBeenCalledWith(
        { email: 'new@example.com' },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      )
    })
  })

  it('renders active invitations and copies invite link', async () => {
    const user = userEvent.setup()
    // stub AFTER userEvent.setup(): setup() installs its own clipboard stub
    const writeText = stubClipboard()

    render(<OrgSettingsPage />, { wrapper: Wrapper })

    await user.click(screen.getByRole('tab', { name: 'Invitations' }))
    expect(screen.getByText('newbie@test.com')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Copy link' }))
    expect(writeText).toHaveBeenCalledWith('http://localhost:3000/invite?token=tok-1')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument()
    })
  })

  it('hides invitations management from non-owner members', async () => {
    membersData = [
      { user_id: 'u2', email: 'member@test.com', full_name: 'Marek Member', role: 'member' },
    ]
    useAuthStore.setState({
      user: { id: 'u2', email: 'member@test.com', full_name: 'Marek Member' },
    })

    const user = userEvent.setup()
    render(<OrgSettingsPage />, { wrapper: Wrapper })

    await user.click(screen.getByRole('tab', { name: 'Invitations' }))

    expect(screen.getByText('Only organization owners can manage invitations.')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Email')).not.toBeInTheDocument()
  })

  it('currency section submits update when saving a changed currency (M12)', async () => {
    const user = userEvent.setup()
    render(<OrgSettingsPage />, { wrapper: Wrapper })

    await user.click(screen.getByRole('tab', { name: 'General' }))
    await user.selectOptions(screen.getByTestId('currency-select'), 'EUR')
    await user.click(screen.getByTestId('currency-save'))

    expect(mockUpdateSettingsMutate).toHaveBeenCalledWith(
      { currency: 'EUR' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('save button stays disabled until the currency selection changes', async () => {
    const user = userEvent.setup()
    render(<OrgSettingsPage />, { wrapper: Wrapper })

    await user.click(screen.getByRole('tab', { name: 'General' }))
    expect(screen.getByTestId('currency-save')).toBeDisabled()

    await user.selectOptions(screen.getByTestId('currency-select'), 'USD')
    expect(screen.getByTestId('currency-save')).toBeEnabled()
  })

  it('org name section submits update when saving a changed name', async () => {
    const user = userEvent.setup()
    render(<OrgSettingsPage />, { wrapper: Wrapper })

    const input = screen.getByTestId('org-name-input') as HTMLInputElement
    expect(input.value).toBe('My Bakery')
    expect(screen.getByTestId('org-name-save')).toBeDisabled()

    await user.clear(input)
    await user.type(input, 'New Bakery')
    await user.click(screen.getByTestId('org-name-save'))

    expect(mockUpdateOrgMutate).toHaveBeenCalledWith(
      { name: 'New Bakery' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('delete requires typing the exact organization name to confirm', async () => {
    const user = userEvent.setup()
    render(<OrgSettingsPage />, { wrapper: Wrapper })

    await user.click(screen.getByTestId('delete-org-button'))
    const input = await screen.findByTestId('delete-org-confirm-input')
    const confirmButton = screen.getByTestId('delete-org-confirm-button')

    expect(confirmButton).toBeDisabled()

    await user.type(input, 'wrong name')
    expect(confirmButton).toBeDisabled()

    await user.clear(input)
    await user.type(input, 'My Bakery')
    expect(confirmButton).toBeEnabled()

    await user.click(confirmButton)
    expect(mockDeleteOrgMutate).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('hides danger zone from non-owner members', async () => {
    membersData = [
      { user_id: 'u2', email: 'member@test.com', full_name: 'Marek Member', role: 'member' },
    ]
    useAuthStore.setState({
      user: { id: 'u2', email: 'member@test.com', full_name: 'Marek Member' },
    })

    render(<OrgSettingsPage />, { wrapper: Wrapper })

    expect(screen.queryByTestId('delete-org-button')).not.toBeInTheDocument()
  })
})
