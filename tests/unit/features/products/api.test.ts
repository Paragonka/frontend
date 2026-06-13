import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProduct,
  getProducts,
  updateProduct,
} from '@/features/products/api'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client')

const orgId = 'org-test-123'

describe('Products API', () => {
  it('getProducts builds correct query params', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: { data: [], next_cursor: null } })

    await getProducts(orgId, { name: 'Bread', limit: 10 })
    expect(mockGet).toHaveBeenCalledWith('/products', {
      params: { org_id: orgId, 'filter[name]': 'Bread', limit: 10 },
    })
  })

  it('getProducts passes cursor param', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: { data: [], next_cursor: null } })

    await getProducts(orgId, { cursor: 'abc123', limit: 50 })
    expect(mockGet).toHaveBeenCalledWith('/products', {
      params: { org_id: orgId, cursor: 'abc123', limit: 50 },
    })
  })

  it('getProducts passes filter[product_type] param', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: { data: [], next_cursor: null } })

    await getProducts(orgId, { product_type: 'good' })
    expect(mockGet).toHaveBeenCalledWith('/products', {
      params: { org_id: orgId, 'filter[product_type]': 'good' },
    })
  })

  it('getProducts passes filter[category] param', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: { data: [], next_cursor: null } })

    await getProducts(orgId, { category: 'Pastry' })
    expect(mockGet).toHaveBeenCalledWith('/products', {
      params: { org_id: orgId, 'filter[category]': 'Pastry' },
    })
  })

  it('getAllProducts calls GET /products/all', async () => {
    const mockGet = vi.mocked(apiClient.get)
    const products = [
      {
        id: '1',
        org_id: 'o1',
        name: 'Bread',
        category: '',
        unit: 'pcs',
        product_type: 'good' as const,
        price: '10.00',
        cost_price: '5.00',
        stock_qty: null,
        track_inventory: false,
        is_sellable: true,
        is_active: true,
      },
    ]
    mockGet.mockResolvedValue({ data: products })

    const result = await getAllProducts(orgId)
    expect(mockGet).toHaveBeenCalledWith('/products/all', {
      params: { org_id: orgId },
    })
    expect(result).toEqual(products)
  })

  it('getProduct calls GET /products/:id', async () => {
    const mockGet = vi.mocked(apiClient.get)
    const product = {
      id: '1',
      org_id: 'o1',
      name: 'Bread',
      category: '',
      unit: 'pcs',
      product_type: 'good' as const,
      price: '10.00',
      cost_price: '5.00',
      stock_qty: null,
      track_inventory: false,
      is_sellable: true,
      is_active: true,
    }
    mockGet.mockResolvedValue({ data: product })

    const result = await getProduct(orgId, '1')
    expect(mockGet).toHaveBeenCalledWith('/products/1', {
      params: { org_id: orgId },
    })
    expect(result).toEqual(product)
  })

  it('createProduct posts correct data', async () => {
    const mockPost = vi.mocked(apiClient.post)
    const created = {
      id: '1',
      org_id: 'o1',
      name: 'Bread',
      category: '',
      unit: 'pcs',
      product_type: 'good' as const,
      price: '10.00',
      cost_price: '5.00',
      stock_qty: null,
      track_inventory: false,
      is_sellable: true,
      is_active: true,
    }
    mockPost.mockResolvedValue({ data: created })

    const result = await createProduct(orgId, { name: 'Bread', price: 10, cost_price: 5 })
    expect(mockPost).toHaveBeenCalledWith(
      '/products',
      { name: 'Bread', price: 10, cost_price: 5 },
      { params: { org_id: orgId } },
    )
    expect(result).toEqual(created)
  })

  it('updateProduct puts correct data', async () => {
    const mockPut = vi.mocked(apiClient.put)
    const updated = {
      id: '1',
      org_id: 'o1',
      name: 'Updated Bread',
      category: '',
      unit: 'pcs',
      product_type: 'good' as const,
      price: '15.00',
      cost_price: '5.00',
      stock_qty: null,
      track_inventory: false,
      is_sellable: true,
      is_active: true,
    }
    mockPut.mockResolvedValue({ data: updated })

    const result = await updateProduct(orgId, '1', { name: 'Updated Bread', price: 15 })
    expect(mockPut).toHaveBeenCalledWith(
      '/products/1',
      { name: 'Updated Bread', price: 15 },
      { params: { org_id: orgId } },
    )
    expect(result).toEqual(updated)
  })

  it('deleteProduct calls DELETE /products/:id', async () => {
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValue({})

    await deleteProduct(orgId, '1')
    expect(mockDelete).toHaveBeenCalledWith('/products/1', {
      params: { org_id: orgId },
    })
  })
})
