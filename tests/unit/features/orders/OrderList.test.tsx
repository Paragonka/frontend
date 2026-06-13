import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { OrderList } from '@/features/orders/components/OrderList'

const mockOrders = {
  data: [
    {
      id: 'o1',
      org_id: 'o1',
      client_id: null,
      status: 'draft' as const,
      total: 100,
      execution_date: '2025-01-15',
      notes: '',
    },
    {
      id: 'o2',
      org_id: 'o1',
      client_id: 'c1',
      status: 'confirmed' as const,
      total: 200,
      execution_date: '2025-01-20',
      notes: 'Urgent',
    },
  ],
  next_cursor: null,
  total: 2,
}

const mockOrdersWithMany = {
  data: [
    {
      id: 'o1',
      org_id: 'o1',
      client_id: null,
      status: 'draft' as const,
      total: 100,
      execution_date: '2025-01-15',
      notes: '',
    },
  ],
  next_cursor: 'cursor-abc',
  total: 100,
}

const mockOrdersWithDeleted = {
  data: [
    {
      id: 'o1',
      org_id: 'o1',
      client_id: null,
      status: 'done' as const,
      is_deleted: true,
      total: 100,
      execution_date: '2025-01-15',
      notes: '',
    },
    {
      id: 'o2',
      org_id: 'o1',
      client_id: 'c1',
      status: 'confirmed' as const,
      deleted_at: '2025-01-21T10:00:00Z',
      total: 200,
      execution_date: '2025-01-20',
      notes: 'Urgent',
    },
  ],
  next_cursor: null,
  total: 2,
}

let mockUseOrders: {
  data:
    | {
        data: Array<{
          id: string
          org_id: string
          client_id: string | null
          status: string
          total: number
          execution_date: string
          notes: string
        }>
        next_cursor: string | null
        total: number
      }
    | undefined
  isLoading: boolean
} = {
  data: mockOrders,
  isLoading: false,
}

const mockMutateAsync = vi.fn().mockResolvedValue({})

vi.mock('@/features/orders/hooks/useOrders', () => ({
  useOrders: () => mockUseOrders,
  useOrder: (id: string) => ({
    data: id
      ? {
          id,
          org_id: 'o1',
          client_id: 'c1',
          status: 'draft',
          total: 100,
          execution_date: '2025-01-15',
          notes: '',
        }
      : undefined,
    isLoading: false,
  }),
  useCreateOrder: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useChangeOrderStatus: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useDeleteOrder: () => ({ mutate: mockMutateAsync, isPending: false }),
  useAddOrderItem: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useRemoveOrderItem: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useCreateWriteOff: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('OrderList', () => {
  beforeEach(() => {
    mockUseOrders = { data: mockOrders, isLoading: false }
    mockMutateAsync.mockClear()
    window.confirm = vi.fn(() => true)
  })

  it('renders page title', () => {
    render(<OrderList />, { wrapper: Wrapper })
    expect(screen.getByText('Orders')).toBeInTheDocument()
  })

  it('renders order rows', () => {
    render(<OrderList />, { wrapper: Wrapper })
    expect(screen.getByText('100,00 zł')).toBeInTheDocument()
    expect(screen.getByText('200,00 zł')).toBeInTheDocument()
  })

  it('renders status filter', () => {
    render(<OrderList />, { wrapper: Wrapper })
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<OrderList />, { wrapper: Wrapper })
    expect(screen.getByText('New Order')).toBeInTheDocument()
  })

  it('renders detail buttons for each order', () => {
    render(<OrderList />, { wrapper: Wrapper })
    const detailButtons = screen.getAllByText('Details')
    expect(detailButtons).toHaveLength(2)
  })

  it('shows loading state', () => {
    mockUseOrders = { data: undefined, isLoading: true }
    render(<OrderList />, { wrapper: Wrapper })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows pagination when total exceeds limit', () => {
    mockUseOrders = { data: mockOrdersWithMany, isLoading: false }
    render(<OrderList />, { wrapper: Wrapper })
    expect(screen.getByText(/Showing/)).toBeInTheDocument()
  })

  it('hides pagination when total <= limit', () => {
    render(<OrderList />, { wrapper: Wrapper })
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()
  })

  it('renders status badges in the table', () => {
    render(<OrderList />, { wrapper: Wrapper })
    const draftElements = screen.getAllByText('Draft')
    expect(draftElements.length).toBeGreaterThanOrEqual(1)
    const confirmedElements = screen.getAllByText('Confirmed')
    expect(confirmedElements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders deleted badge for orders marked is_deleted', () => {
    mockUseOrders = { data: mockOrdersWithDeleted, isLoading: false }
    render(<OrderList />, { wrapper: Wrapper })
    const badges = screen.getAllByText('Deleted')
    expect(badges).toHaveLength(2)
  })

  it('renders deleted badge for orders with deleted_at set', () => {
    mockUseOrders = { data: mockOrdersWithDeleted, isLoading: false }
    render(<OrderList />, { wrapper: Wrapper })
    expect(screen.getAllByText('Deleted')).toHaveLength(2)
  })

  it('does not render deleted badge for active orders', () => {
    render(<OrderList />, { wrapper: Wrapper })
    expect(screen.queryByText('Deleted')).not.toBeInTheDocument()
  })

  it('applies muted styling to deleted order rows', () => {
    mockUseOrders = { data: mockOrdersWithDeleted, isLoading: false }
    render(<OrderList />, { wrapper: Wrapper })
    const badge = screen.getAllByText('Deleted')[0] as HTMLElement
    const row = badge.closest('tr')
    expect(row?.className).toContain('opacity-60')
  })

  it('renders date filter inputs', () => {
    render(<OrderList />, { wrapper: Wrapper })
    expect(screen.getByLabelText('Date from')).toBeInTheDocument()
    expect(screen.getByLabelText('Date to')).toBeInTheDocument()
  })

  it('renders show deleted filter toggle', () => {
    render(<OrderList />, { wrapper: Wrapper })
    const toggle = screen.getByLabelText('Show deleted')
    expect(toggle).toBeInTheDocument()
    expect(toggle).not.toBeChecked()
  })

  it('toggles show deleted filter', async () => {
    const user = userEvent.setup()
    render(<OrderList />, { wrapper: Wrapper })
    const toggle = screen.getByLabelText('Show deleted')
    await user.click(toggle)
    expect(toggle).toBeChecked()
  })

  it('renders delete buttons for each order', () => {
    render(<OrderList />, { wrapper: Wrapper })
    const deleteButtons = screen.getAllByText('Delete')
    expect(deleteButtons).toHaveLength(2)
  })

  it('deletes order after confirmation', async () => {
    const confirmMock = window.confirm as ReturnType<typeof vi.fn>
    confirmMock.mockReturnValue(true)
    const user = userEvent.setup()
    render(<OrderList />, { wrapper: Wrapper })
    const deleteButtons = screen.getAllByText('Delete')
    await user.click(deleteButtons[0] as HTMLElement)
    expect(confirmMock).toHaveBeenCalled()
    expect(mockMutateAsync).toHaveBeenCalledWith('o1')
  })

  it('does not delete order when confirmation is cancelled', async () => {
    const confirmMock = window.confirm as ReturnType<typeof vi.fn>
    confirmMock.mockReturnValue(false)
    const user = userEvent.setup()
    render(<OrderList />, { wrapper: Wrapper })
    const deleteButtons = screen.getAllByText('Delete')
    await user.click(deleteButtons[0] as HTMLElement)
    expect(confirmMock).toHaveBeenCalled()
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('updates status filter', async () => {
    const user = userEvent.setup()
    render(<OrderList />, { wrapper: Wrapper })
    const select = screen.getByLabelText('Status')
    await user.selectOptions(select, 'draft')
    expect(select).toHaveValue('draft')
  })
})
