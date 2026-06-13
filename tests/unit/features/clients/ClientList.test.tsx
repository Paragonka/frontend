import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ClientList } from '@/features/clients/components/ClientList'

const mockClients = {
  data: [
    { id: 'c1', org_id: 'o1', name: 'John', surname: 'Doe', phone: '+79001234567', notes: '' },
    { id: 'c2', org_id: 'o1', name: 'Jane', surname: 'Smith', phone: '+79007654321', notes: '' },
  ],
  next_cursor: null,
  total: 2,
}

const mockClientsWithMany = {
  data: [
    { id: 'c1', org_id: 'o1', name: 'John', surname: 'Doe', phone: '+79001234567', notes: '' },
  ],
  next_cursor: 'cursor-abc',
  total: 100,
}

let mockUseClients: {
  data:
    | {
        data: Array<{
          id: string
          org_id: string
          name: string
          surname: string
          phone: string
          notes: string
        }>
        next_cursor: string | null
        total: number
      }
    | undefined
  isLoading: boolean
} = {
  data: mockClients,
  isLoading: false,
}

const mockMutateAsync = vi.fn()
const mockDeleteMutate = vi.fn()

vi.mock('@/features/clients/hooks/useClients', () => ({
  useClients: () => mockUseClients,
  useClient: (id: string) => ({
    data: id
      ? { id, org_id: 'o1', name: 'John', surname: 'Doe', phone: '123', notes: '' }
      : undefined,
    isLoading: false,
  }),
  useCreateClient: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useUpdateClient: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useDeleteClient: () => ({ mutate: mockDeleteMutate, isPending: false }),
}))

beforeEach(() => {
  mockMutateAsync.mockClear()
  mockDeleteMutate.mockClear()
})

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

describe('ClientList', () => {
  beforeEach(() => {
    mockUseClients = { data: mockClients, isLoading: false }
  })

  it('renders page title', () => {
    render(<ClientList />, { wrapper: Wrapper })
    expect(screen.getByText('Clients')).toBeInTheDocument()
  })

  it('renders client rows', () => {
    render(<ClientList />, { wrapper: Wrapper })
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('Jane')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<ClientList />, { wrapper: Wrapper })
    expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<ClientList />, { wrapper: Wrapper })
    expect(screen.getByText('New Client')).toBeInTheDocument()
  })

  it('renders edit buttons for each client', () => {
    render(<ClientList />, { wrapper: Wrapper })
    const editButtons = screen.getAllByText('Edit')
    expect(editButtons).toHaveLength(2)
  })

  it('shows loading state', () => {
    mockUseClients = { data: undefined, isLoading: true }
    render(<ClientList />, { wrapper: Wrapper })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows pagination when total exceeds limit', () => {
    mockUseClients = { data: mockClientsWithMany, isLoading: false }
    render(<ClientList />, { wrapper: Wrapper })
    expect(screen.getByText(/Showing/)).toBeInTheDocument()
  })

  it('hides pagination when total <= limit', () => {
    render(<ClientList />, { wrapper: Wrapper })
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()
  })

  it('updates search params on search input change', async () => {
    const user = userEvent.setup()
    render(<ClientList />, { wrapper: Wrapper })
    const searchInput = screen.getByPlaceholderText('Search by name...')
    await user.type(searchInput, 'John')
    expect(searchInput).toHaveValue('John')
  })

  it('renders a delete button for each client', () => {
    render(<ClientList />, { wrapper: Wrapper })
    const deleteButtons = screen.getAllByText('Delete')
    expect(deleteButtons).toHaveLength(2)
  })

  it('deletes a client after confirm', async () => {
    const user = userEvent.setup()
    const confirmMock = vi.fn(() => true)
    window.confirm = confirmMock as typeof window.confirm
    render(<ClientList />, { wrapper: Wrapper })
    const deleteButtons = screen.getAllByText('Delete')
    await user.click(deleteButtons[0] as HTMLElement)
    expect(confirmMock).toHaveBeenCalledWith('Delete client?')
    expect(mockDeleteMutate).toHaveBeenCalledWith('c1')
  })

  it('does not delete a client when confirm is declined', async () => {
    const user = userEvent.setup()
    window.confirm = vi.fn(() => false) as typeof window.confirm
    render(<ClientList />, { wrapper: Wrapper })
    const deleteButtons = screen.getAllByText('Delete')
    await user.click(deleteButtons[0] as HTMLElement)
    expect(mockDeleteMutate).not.toHaveBeenCalled()
  })

  it('renders client name as a link to the detail page', () => {
    render(<ClientList />, { wrapper: Wrapper })
    const links = screen.getAllByRole('link', { name: /John|Jane/ })
    expect(links).toHaveLength(2)
  })

  it('renders notes column with truncated note', () => {
    const clientsWithNotes = {
      data: [
        {
          id: 'c1',
          org_id: 'o1',
          name: 'John',
          surname: 'Doe',
          phone: '+79001234567',
          notes: 'A very long note about this client preferences and history',
        },
        {
          id: 'c2',
          org_id: 'o1',
          name: 'Jane',
          surname: 'Smith',
          phone: '+79007654321',
          notes: '',
        },
      ],
      next_cursor: null,
      total: 2,
    }
    mockUseClients = { data: clientsWithNotes, isLoading: false }
    render(<ClientList />, { wrapper: Wrapper })
    const note = screen.getByText('A very long note about this client preferences and history')
    expect(note).toBeInTheDocument()
    expect(note).toHaveProperty(
      'title',
      'A very long note about this client preferences and history',
    )
    expect(note.className).toContain('truncate')
    // empty notes show a dash
    expect(screen.getAllByText('—')).toHaveLength(1)
  })
})
