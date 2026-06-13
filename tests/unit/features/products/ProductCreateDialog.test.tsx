import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductCreateDialog } from '@/features/products/components/ProductCreateDialog'

const mockMutateAsync = vi.fn<(input: Record<string, unknown>) => Promise<{ id: string }>>()
mockMutateAsync.mockResolvedValue({ id: 'new-1' })

vi.mock('@/features/products/hooks/useProducts', () => ({
  useAllProducts: () => ({ data: [] }),
  useCreateProduct: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
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
      <ProductCreateDialog open onOpenChange={vi.fn()} />
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

describe('ProductCreateDialog', () => {
  beforeEach(() => {
    mockMutateAsync.mockClear()
  })

  it('renders stock fields', () => {
    renderDialog()
    expect(screen.getByLabelText('Stock quantity')).toBeInTheDocument()
    expect(screen.getByLabelText('Track inventory')).toBeChecked()
    expect(screen.getByLabelText('Sellable')).toBeChecked()
  })

  it('sends stock fields when creating a material with stock', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText('Name *'), 'Leather')
    await user.selectOptions(screen.getByLabelText('Product type'), 'material')
    await user.type(screen.getByLabelText('Stock quantity'), '10')

    await user.click(screen.getByRole('button', { name: 'Create' }))

    await vi.waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1))
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Leather',
        product_type: 'material',
        stock_qty: 10,
        track_inventory: true,
        is_sellable: true,
      }),
    )
  })

  it('rejects negative stock and does not call the API', async () => {
    const user = userEvent.setup()
    const { container } = renderDialog()

    await user.type(screen.getByLabelText('Name *'), 'BadStock')
    fireEvent.change(screen.getByLabelText('Stock quantity'), { target: { value: '-5' } })
    submitForm(container)

    expect(await screen.findByText('Stock quantity must be at least 0')).toBeInTheDocument()
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('sends null stock_qty when the field is left empty', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText('Name *'), 'ServiceOnly')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await vi.waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1))
    expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ stock_qty: null }))
  })

  it('sends unchecked track_inventory / is_sellable as false', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText('Name *'), 'Archived thing')
    fireEvent.click(screen.getByLabelText('Track inventory'))
    fireEvent.click(screen.getByLabelText('Sellable'))
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await vi.waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1))
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ track_inventory: false, is_sellable: false }),
    )
  })
})
