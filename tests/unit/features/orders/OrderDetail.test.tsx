import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { OrderDetail } from '@/features/orders/components/OrderDetail'
import { useAuthStore } from '@/shared/store/auth'
import { server } from '../../../mocks/server'

const changeStatusMock = {
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
  isError: false,
  error: null as Error | null,
}

const mockOrderPhotos = [{ key: 'org-1/orders/o1/photo-1.jpg' }]

let mockOrderData: {
  id: string
  org_id: string
  client_id: string | null
  client_name: string
  status: string
  total: number
  execution_date: string
  notes: string
  items: unknown[]
  custom_fields?: Record<string, unknown>
} = {
  id: 'o1',
  org_id: 'org-1',
  client_id: 'c1',
  client_name: 'John Doe',
  status: 'draft',
  total: 100,
  execution_date: '2025-01-15',
  notes: '',
  items: [],
}

vi.mock('@/features/media/hooks/useMedia', () => ({
  useEntityPhotos: () => ({ data: mockOrderPhotos }),
  useDeleteMedia: () => ({ mutate: vi.fn(), isPending: false }),
  useUploadPhoto: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}))

vi.mock('@/features/orders/hooks/useOrders', () => ({
  useOrder: () => ({ data: mockOrderData, isLoading: false }),
  useChangeOrderStatus: () => changeStatusMock,
  useAddOrderItem: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
  }),
  useUpdateOrderItem: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
  }),
  useRemoveOrderItem: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    isError: false,
    error: null,
  }),
  useCreateWriteOff: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
  }),
}))

function renderDetail() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/app/org-1/orders/o1']}>
        <Routes>
          <Route path="/app/:orgId/orders/:id" element={<OrderDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OrderDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    changeStatusMock.isError = false
    changeStatusMock.error = null
    mockOrderData = {
      id: 'o1',
      org_id: 'org-1',
      client_id: 'c1',
      client_name: 'John Doe',
      status: 'draft',
      total: 100,
      execution_date: '2025-01-15',
      notes: '',
      items: [],
    }
  })

  it('renders order info', () => {
    renderDetail()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })

  it('renders photos block with key-based src', () => {
    useAuthStore.setState({ currentOrgId: 'org-1' })
    renderDetail()
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/api/v1/media/org-1/orders/o1/photo-1.jpg?org_id=org-1')
    expect(screen.getByText('Upload photos')).toBeInTheDocument()
  })

  it('changes status on confirm click', async () => {
    const user = userEvent.setup()
    renderDetail()
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    await waitFor(() =>
      expect(changeStatusMock.mutateAsync).toHaveBeenCalledWith({
        orderId: 'o1',
        status: 'confirmed',
      }),
    )
  })

  it('shows a visible error when status change fails', async () => {
    changeStatusMock.isError = true
    changeStatusMock.error = new Error('Access denied')
    const user = userEvent.setup()
    renderDetail()
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Access denied')
  })

  it('renders custom fields of the order', async () => {
    mockOrderData = {
      ...mockOrderData,
      custom_fields: { delivery_date: '2025-03-01', is_vip: true },
    }
    useAuthStore.setState({ currentOrgId: 'org-1' })
    server.use(
      http.get('/api/v1/eav/attributes', ({ request }) => {
        const url = new URL(request.url)
        if (url.searchParams.get('entity_code') === 'order') {
          return HttpResponse.json([
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
          ])
        }
        return HttpResponse.json([])
      }),
    )
    renderDetail()

    await waitFor(() => {
      expect(screen.getByText('Custom fields')).toBeInTheDocument()
      expect(screen.getByText('Delivery date:')).toBeInTheDocument()
    })
    expect(screen.getByText('2025-03-01')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('does not render the custom fields section when there are none', () => {
    renderDetail()
    expect(screen.queryByText('Custom fields')).not.toBeInTheDocument()
  })
})
