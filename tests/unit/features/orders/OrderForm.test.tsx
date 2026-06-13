import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { OrderForm } from '@/features/orders/components/OrderForm'

const mockCreateMutateAsync = vi.fn().mockResolvedValue({ id: 'o-new-1' })

vi.mock('@/features/orders/hooks/useOrders', () => ({
  useCreateOrder: () => ({ mutateAsync: mockCreateMutateAsync, isPending: false }),
}))

vi.mock('@/features/clients/hooks/useClients', () => ({
  useAllClients: () => ({ data: [], isLoading: false }),
}))

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/app/org-1/orders/new']}>
        <Routes>
          <Route path="app/:orgId" element={null}>
            <Route path="orders/new" element={children} />
          </Route>
          <Route path="*" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('OrderForm', () => {
  beforeEach(() => {
    mockCreateMutateAsync.mockClear()
  })

  it('navigates to the created order detail page after submit', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <OrderForm />
      </Wrapper>,
    )

    await user.click(screen.getByRole('button', { name: 'Create order' }))

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith({
        client_id: null,
        execution_date: expect.any(String),
        notes: undefined,
        custom_fields: {},
        local_fields: {},
        items: [],
      })
    })
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/app/org-1/orders/o-new-1')
    })
  })

  it('sends filled local fields in the create payload', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <OrderForm />
      </Wrapper>,
    )

    await user.click(screen.getByRole('button', { name: 'Add field' }))
    await user.type(screen.getByLabelText('Key'), 'gift_wrap')
    await user.type(screen.getByLabelText('Value'), 'yes')
    await user.click(screen.getByRole('button', { name: 'Create order' }))

    await waitFor(() => {
      const [payload] = mockCreateMutateAsync.mock.calls[0] as [
        { local_fields?: Record<string, string> },
      ]
      expect(payload?.local_fields).toEqual({ gift_wrap: 'yes' })
    })
  })

  it('navigates to the orders list when cancelled', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <OrderForm />
      </Wrapper>,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/app/org-1/orders')
    })
  })
})
