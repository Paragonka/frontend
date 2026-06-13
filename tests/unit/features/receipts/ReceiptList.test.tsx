import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ReceiptList } from '@/features/receipts/components/ReceiptList'

const mockReceipts = {
  data: [
    {
      id: 'r1',
      org_id: 'o1',
      client_id: null,
      order_id: null,
      receipt_date: '2025-01-15',
      total: 100,
      source: 'jpk',
      raw_data: null,
      notes: null,
    },
    {
      id: 'r2',
      org_id: 'o1',
      client_id: 'c1',
      order_id: null,
      receipt_date: '2025-01-20',
      total: 200,
      source: null,
      raw_data: null,
      notes: 'Test',
    },
  ],
  next_cursor: null,
  total: 2,
}

const mockReceiptsWithMany = {
  data: [
    {
      id: 'r1',
      org_id: 'o1',
      client_id: null,
      order_id: null,
      receipt_date: '2025-01-15',
      total: 100,
      source: null,
      raw_data: null,
      notes: null,
    },
  ],
  next_cursor: 'cursor-abc',
  total: 100,
}

let mockUseReceipts: {
  data:
    | {
        data: Array<{
          id: string
          org_id: string
          client_id: string | null
          order_id: string | null
          receipt_date: string
          total: number
          source: string | null
          raw_data: Record<string, unknown> | null
          notes: string | null
        }>
        next_cursor: string | null
        total: number
      }
    | undefined
  isLoading: boolean
} = { data: mockReceipts, isLoading: false }

vi.mock('@/features/receipts/hooks/useReceipts', () => ({
  useReceipts: () => mockUseReceipts,
  useReceipt: (id: string) => ({
    data: id
      ? {
          id,
          org_id: 'o1',
          client_id: null,
          order_id: null,
          receipt_date: '2025-01-15',
          total: 100,
          source: null,
          raw_data: null,
          notes: null,
        }
      : undefined,
    isLoading: false,
  }),
  useCreateReceipt: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useDeleteReceipt: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
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

describe('ReceiptList', () => {
  beforeEach(() => {
    mockUseReceipts = { data: mockReceipts, isLoading: false }
  })

  it('renders page title', () => {
    render(<ReceiptList />, { wrapper: Wrapper })
    expect(screen.getByText('Receipts')).toBeInTheDocument()
  })

  it('renders receipt rows', () => {
    render(<ReceiptList />, { wrapper: Wrapper })
    expect(screen.getByText('r1')).toBeInTheDocument()
    expect(screen.getByText('r2')).toBeInTheDocument()
  })

  it('renders source filter', () => {
    render(<ReceiptList />, { wrapper: Wrapper })
    expect(screen.getByLabelText('Source')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<ReceiptList />, { wrapper: Wrapper })
    expect(screen.getByText('New Receipt')).toBeInTheDocument()
  })

  it('renders detail buttons for each receipt', () => {
    render(<ReceiptList />, { wrapper: Wrapper })
    const detailButtons = screen.getAllByText('Details')
    expect(detailButtons).toHaveLength(2)
  })

  it('shows loading state', () => {
    mockUseReceipts = { data: undefined, isLoading: true }
    render(<ReceiptList />, { wrapper: Wrapper })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows pagination when total exceeds limit', () => {
    mockUseReceipts = { data: mockReceiptsWithMany, isLoading: false }
    render(<ReceiptList />, { wrapper: Wrapper })
    expect(screen.getByText(/Showing/)).toBeInTheDocument()
  })

  it('hides pagination when total <= limit', () => {
    render(<ReceiptList />, { wrapper: Wrapper })
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()
  })

  it('renders date filter inputs', () => {
    render(<ReceiptList />, { wrapper: Wrapper })
    expect(screen.getByLabelText('Date from')).toBeInTheDocument()
    expect(screen.getByLabelText('Date to')).toBeInTheDocument()
  })

  it('updates source filter', async () => {
    const user = userEvent.setup()
    render(<ReceiptList />, { wrapper: Wrapper })
    const select = screen.getByLabelText('Source')
    await user.selectOptions(select, 'jpk')
    expect(select).toHaveValue('jpk')
  })
})
