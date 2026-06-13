import {
  addOrderItem,
  changeOrderStatus,
  createOrder,
  createWriteOff,
  deleteOrder,
  getOrder,
  getOrders,
  removeOrderItem,
} from '@/features/orders/api'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client')

const orgId = 'org-test-123'

describe('Orders API', () => {
  it('getOrders builds correct query params', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: { data: [], next_cursor: null } })

    await getOrders(orgId, { status: 'confirmed', limit: 10 })
    expect(mockGet).toHaveBeenCalledWith('/orders', {
      params: { org_id: orgId, 'filter[status]': 'confirmed', limit: 10 },
    })
  })

  it('getOrders passes execution_date_from filter', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: { data: [], next_cursor: null } })

    await getOrders(orgId, { execution_date_from: '2025-01-01' })
    expect(mockGet).toHaveBeenCalledWith('/orders', {
      params: { org_id: orgId, 'filter[execution_date_from]': '2025-01-01' },
    })
  })

  it('getOrders passes cursor param', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: { data: [], next_cursor: null } })

    await getOrders(orgId, { cursor: 'abc123', limit: 50 })
    expect(mockGet).toHaveBeenCalledWith('/orders', {
      params: { org_id: orgId, cursor: 'abc123', limit: 50 },
    })
  })

  it('getOrders passes include_deleted param', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: { data: [], next_cursor: null } })

    await getOrders(orgId, { include_deleted: true })
    expect(mockGet).toHaveBeenCalledWith('/orders', {
      params: { org_id: orgId, include_deleted: true },
    })
  })

  it('getOrder calls GET /orders/:id', async () => {
    const mockGet = vi.mocked(apiClient.get)
    const order = {
      id: '1',
      org_id: 'o1',
      client_id: null,
      status: 'draft' as const,
      total: 100,
      execution_date: '2025-01-15',
      notes: '',
    }
    mockGet.mockResolvedValue({ data: order })

    const result = await getOrder(orgId, '1')
    expect(mockGet).toHaveBeenCalledWith('/orders/1', {
      params: { org_id: orgId },
    })
    expect(result).toEqual(order)
  })

  it('createOrder posts correct data', async () => {
    const mockPost = vi.mocked(apiClient.post)
    const created = {
      id: '1',
      org_id: 'o1',
      client_id: 'c1',
      status: 'draft' as const,
      total: 0,
      execution_date: '2025-01-20',
      notes: 'Test notes',
    }
    mockPost.mockResolvedValue({ data: created })

    const result = await createOrder(orgId, {
      client_id: 'c1',
      execution_date: '2025-01-20',
      notes: 'Test notes',
    })
    expect(mockPost).toHaveBeenCalledWith(
      '/orders',
      {
        client_id: 'c1',
        execution_date: '2025-01-20',
        notes: 'Test notes',
      },
      { params: { org_id: orgId } },
    )
    expect(result).toEqual(created)
  })

  it('addOrderItem posts correct data', async () => {
    const mockPost = vi.mocked(apiClient.post)
    const item = { id: 'item1', order_id: '1', product_id: 'p1', name: 'Bread', price: 10, qty: 2 }
    mockPost.mockResolvedValue({ data: item })

    const result = await addOrderItem(orgId, '1', {
      product_id: 'p1',
      name: 'Bread',
      price: 10,
      qty: 2,
    })
    expect(mockPost).toHaveBeenCalledWith(
      '/orders/1/items',
      {
        product_id: 'p1',
        name: 'Bread',
        price: 10,
        qty: 2,
      },
      { params: { org_id: orgId } },
    )
    expect(result).toEqual(item)
  })

  it('removeOrderItem calls DELETE /orders/:orderId/items/:itemId', async () => {
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValue({})

    await removeOrderItem(orgId, '1', 'item1')
    expect(mockDelete).toHaveBeenCalledWith('/orders/1/items/item1', {
      params: { org_id: orgId },
    })
  })

  it('changeOrderStatus posts correct data', async () => {
    const mockPost = vi.mocked(apiClient.post)
    const updated = {
      id: '1',
      org_id: 'o1',
      client_id: null,
      status: 'confirmed' as const,
      total: 0,
      execution_date: '2025-01-15',
      notes: '',
    }
    mockPost.mockResolvedValue({ data: updated })

    const result = await changeOrderStatus(orgId, '1', 'confirmed')
    expect(mockPost).toHaveBeenCalledWith(
      '/orders/1/status',
      { status: 'confirmed' },
      { params: { org_id: orgId } },
    )
    expect(result).toEqual(updated)
    expect(result.status).toBe('confirmed')
  })

  it('changeOrderStatus uses POST, not PATCH', async () => {
    const mockPost = vi.mocked(apiClient.post)
    const mockPatch = vi.mocked(apiClient.patch)
    mockPost.mockResolvedValue({
      data: {
        id: '1',
        org_id: 'o1',
        client_id: null,
        status: 'done' as const,
        total: 0,
        execution_date: '2025-01-15',
        notes: '',
      },
    })

    await changeOrderStatus(orgId, '1', 'done')
    expect(mockPatch).not.toHaveBeenCalled()
    expect(mockPost).toHaveBeenCalledWith(
      '/orders/1/status',
      { status: 'done' },
      { params: { org_id: orgId } },
    )
  })

  it('deleteOrder calls DELETE /orders/:id', async () => {
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValue({})

    await deleteOrder(orgId, '1')
    expect(mockDelete).toHaveBeenCalledWith('/orders/1', {
      params: { org_id: orgId },
    })
  })

  it('createWriteOff posts correct data', async () => {
    const mockPost = vi.mocked(apiClient.post)
    const writeOffResult = {
      id: 'wo1',
      product_id: 'p1',
      qty: 2,
      reason: 'spoiled',
      created_at: '2025-01-01T00:00:00Z',
    }
    mockPost.mockResolvedValue({ data: writeOffResult })

    const result = await createWriteOff(orgId, '1', {
      order_item_id: 'item1',
      qty: 2,
      reason: 'spoiled',
    })
    expect(mockPost).toHaveBeenCalledWith(
      '/orders/1/write-offs',
      {
        order_item_id: 'item1',
        qty: 2,
        reason: 'spoiled',
      },
      { params: { org_id: orgId } },
    )
    expect(result).toEqual(writeOffResult)
  })
})
