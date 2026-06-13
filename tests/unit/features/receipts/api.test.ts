import {
  createReceipt,
  deleteReceipt,
  getReceipt,
  getReceiptItems,
  getReceipts,
} from '@/features/receipts/api'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client')

const orgId = 'org-test-123'

describe('Receipts API', () => {
  it('getReceipts builds correct query params', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: { data: [], next_cursor: null } })

    await getReceipts(orgId, { source: 'jpk', limit: 10 })
    expect(mockGet).toHaveBeenCalledWith('/receipts', {
      params: { org_id: orgId, 'filter[source]': 'jpk', limit: 10 },
    })
  })

  it('getReceipts passes date filters', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: { data: [], next_cursor: null } })

    await getReceipts(orgId, { date_from: '2025-01-01', date_to: '2025-01-31' })
    expect(mockGet).toHaveBeenCalledWith('/receipts', {
      params: {
        org_id: orgId,
        'filter[date_from]': '2025-01-01',
        'filter[date_to]': '2025-01-31',
      },
    })
  })

  it('getReceipts passes client_id filter', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: { data: [], next_cursor: null } })

    await getReceipts(orgId, { client_id: 'c1' })
    expect(mockGet).toHaveBeenCalledWith('/receipts', {
      params: { org_id: orgId, 'filter[client_id]': 'c1' },
    })
  })

  it('getReceipt calls GET /receipts/:id', async () => {
    const mockGet = vi.mocked(apiClient.get)
    const receipt = {
      id: '1',
      org_id: 'o1',
      client_id: null,
      order_id: null,
      receipt_date: '2025-01-15',
      total: 100,
      source: null,
      raw_data: null,
      notes: null,
    }
    mockGet.mockResolvedValue({ data: receipt })

    const result = await getReceipt(orgId, '1')
    expect(mockGet).toHaveBeenCalledWith('/receipts/1', {
      params: { org_id: orgId },
    })
    expect(result).toEqual(receipt)
  })

  it('createReceipt posts correct data', async () => {
    const mockPost = vi.mocked(apiClient.post)
    const created = {
      id: '1',
      org_id: 'o1',
      client_id: null,
      order_id: null,
      receipt_date: '2025-01-15',
      total: 50,
      source: 'jpk',
      raw_data: {},
      notes: 'Test',
    }
    mockPost.mockResolvedValue({ data: created })

    const result = await createReceipt(orgId, {
      receipt_date: '2025-01-15',
      source: 'jpk',
      raw_data: {},
      notes: 'Test',
      items: [{ name: 'Bread', price: 10, qty: 5 }],
    })
    expect(mockPost).toHaveBeenCalledWith(
      '/receipts',
      {
        receipt_date: '2025-01-15',
        source: 'jpk',
        raw_data: {},
        notes: 'Test',
        items: [{ name: 'Bread', price: 10, qty: 5 }],
      },
      { params: { org_id: orgId } },
    )
    expect(result).toEqual(created)
  })

  it('deleteReceipt calls DELETE /receipts/:id', async () => {
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValue({})

    await deleteReceipt(orgId, '1')
    expect(mockDelete).toHaveBeenCalledWith('/receipts/1', {
      params: { org_id: orgId },
    })
  })

  it('getReceiptItems calls GET /receipts/:id/items', async () => {
    const mockGet = vi.mocked(apiClient.get)
    const items = [
      { id: 'i1', receipt_id: '1', product_id: null, name: 'Bread', price: 10, qty: 5 },
    ]
    mockGet.mockResolvedValue({ data: items })

    const result = await getReceiptItems(orgId, '1')
    expect(mockGet).toHaveBeenCalledWith('/receipts/1/items', {
      params: { org_id: orgId },
    })
    expect(result).toEqual(items)
  })
})
