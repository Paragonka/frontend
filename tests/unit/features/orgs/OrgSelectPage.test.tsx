import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { OrgSelectPage } from '@/features/orgs/components/OrgSelectPage'

const mockMutate = vi.fn()
const mockSelectOrg = vi.fn()

vi.mock('@/features/orgs/hooks/useOrgs', () => ({
  useOrgs: () => ({
    data: [
      { id: 'org-1', name: 'Test Bakery', owner_id: 'u1', timezone: 'Europe/Warsaw' },
      { id: 'org-2', name: 'Test Cafe', owner_id: 'u1', timezone: 'Europe/Warsaw' },
    ],
    isLoading: false,
  }),
  useCreateOrg: () => ({ mutate: mockMutate, isPending: false }),
  useSelectOrg: () => mockSelectOrg,
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('OrgSelectPage', () => {
  beforeEach(() => {
    mockMutate.mockClear()
    mockSelectOrg.mockClear()
  })

  it('renders org list', () => {
    render(<OrgSelectPage />, { wrapper: Wrapper })

    expect(screen.getByText('Test Bakery')).toBeInTheDocument()
    expect(screen.getByText('Test Cafe')).toBeInTheDocument()
  })

  it('renders create org form', () => {
    render(<OrgSelectPage />, { wrapper: Wrapper })

    expect(screen.getByPlaceholderText('Organization name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })

  it('calls selectOrg on org click', async () => {
    const user = userEvent.setup()
    render(<OrgSelectPage />, { wrapper: Wrapper })

    await user.click(screen.getByText('Test Bakery'))

    expect(mockSelectOrg).toHaveBeenCalledWith('org-1')
  })

  it('calls createOrg on form submit', async () => {
    const user = userEvent.setup()
    render(<OrgSelectPage />, { wrapper: Wrapper })

    await user.type(screen.getByPlaceholderText('Organization name'), 'New Org')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(mockMutate).toHaveBeenCalledWith({ name: 'New Org' })
  })
})
