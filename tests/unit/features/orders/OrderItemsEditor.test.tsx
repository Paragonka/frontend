import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderItemsEditor } from '@/features/orders/components/OrderItemsEditor'
import type { OrderItem } from '@/features/orders/types'

const addItemMock = {
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
  isError: false,
  error: null as Error | null,
}

const removeItemMock = {
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
  isError: false,
  error: null as Error | null,
}

const writeOffMock = {
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
  isError: false,
  error: null as Error | null,
}

const updateItemMock = {
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
  isError: false,
  error: null as Error | null,
}

vi.mock('@/features/orders/hooks/useOrders', () => ({
  useAddOrderItem: () => addItemMock,
  useRemoveOrderItem: () => removeItemMock,
  useUpdateOrderItem: () => updateItemMock,
  useCreateWriteOff: () => writeOffMock,
}))

const items: OrderItem[] = [
  { id: 'i1', order_id: 'o1', product_id: 'p1', name: 'Bread', price: 10, qty: 2 },
]

function renderEditor() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <OrderItemsEditor orderId="o1" items={items} />
    </QueryClientProvider>,
  )
}

describe('OrderItemsEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    addItemMock.isError = false
    addItemMock.error = null
    removeItemMock.isError = false
    removeItemMock.error = null
    writeOffMock.isError = false
    writeOffMock.error = null
  })

  it('sends only order_item_id, qty and reason on write-off', async () => {
    const user = userEvent.setup()
    renderEditor()
    await user.click(screen.getByRole('button', { name: 'Write off' }))
    await user.type(screen.getByLabelText('Qty'), '3')
    await user.type(screen.getByLabelText('Notes'), 'damaged')
    await user.click(screen.getAllByRole('button', { name: 'Write off' })[1] as HTMLElement)

    await waitFor(() => expect(writeOffMock.mutateAsync).toHaveBeenCalledTimes(1))
    const [firstWriteOffArgs] = writeOffMock.mutateAsync.mock.calls
    const [arg] = firstWriteOffArgs ?? []
    expect(arg?.orderId).toBe('o1')
    expect(arg?.input).toEqual({ order_item_id: 'i1', qty: 3, reason: 'damaged' })
    expect(arg?.input).not.toHaveProperty('product_id')
  })

  it('clears the form after successful write-off', async () => {
    const user = userEvent.setup()
    renderEditor()
    await user.click(screen.getByRole('button', { name: 'Write off' }))
    await user.type(screen.getByLabelText('Qty'), '1')
    await user.click(screen.getAllByRole('button', { name: 'Write off' })[1] as HTMLElement)

    await waitFor(() => expect(screen.queryByLabelText('Qty')).not.toBeInTheDocument())
  })

  it('shows a visible error when write-off fails', async () => {
    writeOffMock.isError = true
    writeOffMock.error = new Error('Insufficient stock')
    renderEditor()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Write off' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Insufficient stock')
    expect(screen.getByLabelText('Qty')).toBeInTheDocument()
  })

  it('shows a visible error when removing an item fails', () => {
    removeItemMock.isError = true
    removeItemMock.error = new Error('Not Found')
    renderEditor()

    expect(screen.getByRole('alert')).toHaveTextContent('Not Found')
  })

  it('shows a visible error when adding an item fails', () => {
    addItemMock.isError = true
    addItemMock.error = new Error('Product not found')
    renderEditor()

    expect(screen.getByRole('alert')).toHaveTextContent('Product not found')
  })
})
