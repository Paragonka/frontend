import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { OrderForm } from '@/features/orders/components/OrderForm'
import { useAuthStore } from '@/shared/store/auth'
import { server } from '../../../mocks/server'

const mockCreateMutateAsync = vi.fn().mockResolvedValue({ id: 'o-new-1' })

vi.mock('@/features/orders/hooks/useOrders', () => ({
  useCreateOrder: () => ({ mutateAsync: mockCreateMutateAsync, isPending: false }),
}))

vi.mock('@/features/clients/hooks/useClients', () => ({
  useAllClients: () => ({ data: [], isLoading: false }),
}))

vi.mock('@/features/products/hooks/useProducts', () => ({
  useAllProducts: () => ({ data: [], isLoading: false }),
}))

const orderAttributes = [
  {
    id: 'eav-o1',
    org_id: 'org-1',
    entity_code: 'order',
    code: 'delivery_date',
    name: 'Delivery date',
    field_type: 'date',
    is_required: false,
    default_value: '',
  },
  {
    id: 'eav-o2',
    org_id: 'org-1',
    entity_code: 'order',
    code: 'priority',
    name: 'Priority',
    field_type: 'string',
    is_required: false,
    default_value: '',
  },
]

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

describe('OrderForm EAV custom fields', () => {
  beforeEach(() => {
    mockCreateMutateAsync.mockClear()
    useAuthStore.getState().setCurrentOrg('org-1')
    server.use(
      http.get('/api/v1/eav/attributes', ({ request }) => {
        const url = new URL(request.url)
        if (url.searchParams.get('entity_code') === 'order') {
          return HttpResponse.json(orderAttributes)
        }
        return HttpResponse.json([])
      }),
    )
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('renders EAV fields for the order entity type in the create form', {
    timeout: 15000,
  }, async () => {
    render(
      <Wrapper>
        <OrderForm />
      </Wrapper>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Delivery date')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Priority')).toBeInTheDocument()
  })

  it('passes filled custom fields in the create payload', { timeout: 15000 }, async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <OrderForm />
      </Wrapper>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Delivery date')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Delivery date'), {
      target: { value: '2025-03-01' },
    })
    await user.type(screen.getByLabelText('Priority'), 'high')
    await user.click(screen.getByRole('button', { name: 'Create order' }))

    await waitFor(() => {
      const [payload] = mockCreateMutateAsync.mock.calls[0] as [
        { custom_fields?: Record<string, unknown> },
      ]
      expect(payload?.custom_fields).toEqual({
        delivery_date: '2025-03-01',
        priority: 'high',
      })
    })
  })
})
