import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ReceiptForm } from '@/features/receipts/components/ReceiptForm'

const mockMutateAsync = vi
  .fn()
  .mockResolvedValue({ id: 'r-new', receipt_date: '2025-01-15', total: 0 })

vi.mock('@/features/receipts/hooks/useReceipts', () => ({
  useCreateReceipt: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useReceipt: () => ({ data: undefined, isLoading: false }),
}))

vi.mock('@/features/products/hooks/useProducts', () => ({
  useAllProducts: () => ({
    data: [
      {
        id: 'p1',
        name: 'Bread',
        price: '10.00',
        category: 'Pastry',
        unit: 'pcs',
        product_type: 'good',
        cost_price: '5.00',
        stock_qty: null,
        track_inventory: false,
        is_sellable: true,
        is_active: true,
      },
      {
        id: 'p2',
        name: 'Croissant',
        price: '8.00',
        category: 'Pastry',
        unit: 'pcs',
        product_type: 'good',
        cost_price: '3.00',
        stock_qty: null,
        track_inventory: false,
        is_sellable: true,
        is_active: true,
      },
    ],
    isLoading: false,
  }),
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/app/o1/receipts/new']}>
        <Routes>
          <Route path="/app/:orgId/receipts/new" element={children} />
          <Route path="/app/:orgId/receipts" element={<div>receipts list</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ReceiptForm', () => {
  beforeEach(() => {
    mockMutateAsync.mockClear()
  })

  it('renders form title', () => {
    render(<ReceiptForm />, { wrapper: Wrapper })
    expect(screen.getByText('Create receipt')).toBeInTheDocument()
  })

  it('renders mode tabs', () => {
    render(<ReceiptForm />, { wrapper: Wrapper })
    expect(screen.getByText('Upload JPK')).toBeInTheDocument()
    expect(screen.getByText('Manual')).toBeInTheDocument()
  })

  it('renders date input', () => {
    render(<ReceiptForm />, { wrapper: Wrapper })
    expect(screen.getByLabelText('Date')).toBeInTheDocument()
  })

  it('renders source input', () => {
    render(<ReceiptForm />, { wrapper: Wrapper })
    expect(screen.getByLabelText('Source')).toBeInTheDocument()
  })

  it('renders notes input', () => {
    render(<ReceiptForm />, { wrapper: Wrapper })
    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<ReceiptForm />, { wrapper: Wrapper })
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('shows JPK upload zone by default', () => {
    render(<ReceiptForm />, { wrapper: Wrapper })
    expect(screen.getByText('Upload JPK')).toBeInTheDocument()
    expect(
      screen.getAllByText('Drag and drop the receipt JSON file here').length,
    ).toBeGreaterThanOrEqual(1)
  })

  it('shows product selector in manual mode', async () => {
    render(<ReceiptForm />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText('Manual'))
    expect(screen.getByText('Select product...')).toBeInTheDocument()
  })

  it('calls createReceipt on form submit in manual mode', async () => {
    render(<ReceiptForm />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText('Manual'))

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2025-01-15' } })
    fireEvent.change(screen.getByLabelText('Source'), { target: { value: 'manual' } })
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Test receipt' } })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'p1' } })

    const form = document.querySelector('form') as HTMLElement
    fireEvent.submit(form)

    expect(mockMutateAsync).toHaveBeenCalled()
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        receipt_date: '2025-01-15',
        source: 'manual',
        notes: 'Test receipt',
        items: [expect.objectContaining({ name: 'Bread', price: 10, qty: 1 })],
      }),
    )
  })

  it('shows inline error and does not call createReceipt when price is empty', () => {
    render(<ReceiptForm />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText('Manual'))

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'p1' } })

    fireEvent.change(screen.getByDisplayValue('10'), { target: { value: '' } })

    const form = document.querySelector('form') as HTMLElement
    fireEvent.submit(form)

    expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument()
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('shows inline error and does not call createReceipt when qty is 0', () => {
    render(<ReceiptForm />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText('Manual'))

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'p1' } })

    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '0' } })

    const form = document.querySelector('form') as HTMLElement
    fireEvent.submit(form)

    expect(screen.getByText('Quantity must be greater than 0')).toBeInTheDocument()
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('sends only name/price/qty/product_id in manual submit payload', () => {
    render(<ReceiptForm />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText('Manual'))

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2025-01-15' } })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'p1' } })

    const form = document.querySelector('form') as HTMLElement
    fireEvent.submit(form)

    expect(mockMutateAsync).toHaveBeenCalledTimes(1)
    const [payload] = mockMutateAsync.mock.calls[0] as [{ items: Record<string, unknown>[] }]
    expect(payload.items).toHaveLength(1)
    const item = payload.items[0] as Record<string, unknown>
    expect(Object.keys(item).sort()).toEqual(['name', 'price', 'product_id', 'qty'])
    expect(item).toEqual({ name: 'Bread', price: 10, qty: 1, product_id: 'p1' })
  })
})
