import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ReceiptDetail } from '@/features/receipts/components/ReceiptDetail'

const mockReceipt = {
  id: 'r1',
  org_id: 'o1',
  client_id: null,
  order_id: null,
  receipt_date: '2025-01-15',
  total: 100,
  source: 'jpk',
  raw_data: { store: 'Test Store' },
  notes: 'Test notes',
}

const mockItems = [
  { id: 'i1', receipt_id: 'r1', product_id: null, name: 'Bread', price: 10, qty: 5 },
  { id: 'i2', receipt_id: 'r1', product_id: 'p1', name: 'Croissant', price: 8, qty: 3 },
]

vi.mock('@/features/receipts/hooks/useReceipts', () => ({
  useReceipt: (id: string) => ({
    data: id ? mockReceipt : undefined,
    isLoading: false,
  }),
  useReceiptItems: (id: string) => ({
    data: id ? mockItems : undefined,
    isLoading: false,
  }),
  useDeleteReceipt: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/app/o1/receipts/r1']}>
        <Routes>
          <Route path="/app/:orgId/receipts/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ReceiptDetail', () => {
  it('renders receipt id', () => {
    render(<ReceiptDetail />, { wrapper: Wrapper })
    expect(screen.getByText('r1')).toBeInTheDocument()
  })

  it('renders receipt total', () => {
    render(<ReceiptDetail />, { wrapper: Wrapper })
    expect(screen.getByText('74,00 zł')).toBeInTheDocument()
  })

  it('renders receipt date', () => {
    render(<ReceiptDetail />, { wrapper: Wrapper })
    expect(screen.getByText('15.01.2025')).toBeInTheDocument()
  })

  it('renders source', () => {
    render(<ReceiptDetail />, { wrapper: Wrapper })
    expect(screen.getByText('jpk')).toBeInTheDocument()
  })

  it('renders receipt items', () => {
    render(<ReceiptDetail />, { wrapper: Wrapper })
    expect(screen.getByText('Bread')).toBeInTheDocument()
    expect(screen.getByText('Croissant')).toBeInTheDocument()
  })

  it('renders raw data section', () => {
    render(<ReceiptDetail />, { wrapper: Wrapper })
    expect(screen.getByText('Raw data')).toBeInTheDocument()
  })
})
