import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductEditDialog } from '@/features/products/components/ProductEditDialog'

const mockMutateAsync = vi.fn<(args: Record<string, unknown>) => Promise<unknown>>()
mockMutateAsync.mockResolvedValue({})
const mockProduct = {
  id: 'p1',
  org_id: 'o1',
  name: 'Leather',
  category: 'Materials',
  unit: 'm',
  product_type: 'material' as const,
  price: '12.50',
  cost_price: '8.00',
  stock_qty: 25,
  track_inventory: true,
  is_sellable: false,
  is_active: true,
  custom_fields: {},
}

vi.mock('@/features/products/hooks/useProducts', () => ({
  useProduct: (id: string) => ({ data: id ? mockProduct : undefined, isLoading: false }),
  useUpdateProduct: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}))

vi.mock('@/features/media/hooks/useMedia', () => ({
  useEntityPhotos: () => ({ data: [] }),
  useDeleteMedia: () => ({ mutate: vi.fn(), isPending: false }),
  useUploadPhoto: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/features/eav/components/EavFieldsForm', async () => {
  const { forwardRef, useImperativeHandle } = await import('react')
  return {
    EavFieldsForm: forwardRef(function MockEavFieldsForm(_props, ref) {
      useImperativeHandle(ref, () => ({ validate: () => true }), [])
      return null
    }),
  }
})

vi.mock('@/shared/ui/dialog', async () => {
  const { forwardRef } = await import('react')
  type DivProps = { children?: React.ReactNode; className?: string }
  const PlainDiv = forwardRef<HTMLDivElement, DivProps>(function MockDiv(
    { children, ...props },
    ref,
  ) {
    return (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  })
  return {
    Dialog: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    DialogContent: PlainDiv,
    DialogHeader: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    DialogTitle: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
  }
})

function renderDialog() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <ProductEditDialog productId="p1" open onOpenChange={vi.fn()} />
    </QueryClientProvider>,
  )
}

/**
 * Submits the dialog form directly: happy-dom (like real browsers) silently
 * swallows the submit event when native constraint validation fails
 * (e.g. number input `min="0"` vs negative value), which would bypass
 * react-hook-form/zod entirely.
 */
function submitForm(container: HTMLElement) {
  const form = container.querySelector('form')
  if (!form) throw new Error('form not found')
  fireEvent.submit(form)
}

describe('ProductEditDialog', () => {
  beforeEach(() => {
    mockMutateAsync.mockClear()
  })

  it('prefills stock fields from the product', () => {
    renderDialog()
    expect(screen.getByLabelText('Name *')).toHaveValue('Leather')
    expect(screen.getByLabelText('Stock quantity')).toHaveValue(25)
    expect(screen.getByLabelText('Track inventory')).toBeChecked()
    expect(screen.getByLabelText('Sellable')).not.toBeChecked()
  })

  it('sends updated stock fields on save', async () => {
    const user = userEvent.setup()
    const { container } = renderDialog()

    const stockInput = screen.getByLabelText('Stock quantity')
    await user.clear(stockInput)
    await user.type(stockInput, '7')

    submitForm(container)

    await vi.waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1))
    expect(mockMutateAsync).toHaveBeenCalledWith({
      id: 'p1',
      input: expect.objectContaining({
        stock_qty: 7,
        track_inventory: true,
        is_sellable: false,
        name: 'Leather',
        local_fields: {},
      }),
    })
  })

  it('sends null stock when the field is cleared and inventory unchecked', async () => {
    const user = userEvent.setup()
    const { container } = renderDialog()

    await user.clear(screen.getByLabelText('Stock quantity'))
    fireEvent.click(screen.getByLabelText('Track inventory'))
    submitForm(container)

    await vi.waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1))
    expect(mockMutateAsync).toHaveBeenCalledWith({
      id: 'p1',
      input: expect.objectContaining({ stock_qty: null, track_inventory: false }),
    })
  })

  it('rejects negative stock and keeps the dialog open', async () => {
    const { container } = renderDialog()

    const stockInput = screen.getByLabelText('Stock quantity')
    fireEvent.change(stockInput, { target: { value: '-3' } })
    submitForm(container)

    expect(await screen.findByText('Stock quantity must be at least 0')).toBeInTheDocument()
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })
})
