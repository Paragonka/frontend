import { apiClient } from '@/shared/api/client'
import type { PaginatedResponse } from '@/shared/api/types'
import type { Product, ProductCreate, ProductFilters, ProductUpdate } from './types'

export async function getProducts(
  orgId: string,
  params: ProductFilters,
): Promise<PaginatedResponse<Product>> {
  const query: Record<string, string | number | boolean | undefined> = { org_id: orgId }
  if (params.cursor) query.cursor = params.cursor
  if (params.limit) query.limit = params.limit
  if (params.sort) query.sort = params.sort
  if (params.name) query['filter[name]'] = params.name
  if (params.category) query['filter[category]'] = params.category
  if (params.product_type) query['filter[product_type]'] = params.product_type
  if (params.is_active !== undefined) query['filter[is_active]'] = params.is_active

  const { data } = await apiClient.get('/products', { params: query })
  return data
}

export async function getAllProducts(orgId: string): Promise<Product[]> {
  const { data } = await apiClient.get('/products/all', { params: { org_id: orgId } })
  return data
}

export async function getProduct(orgId: string, id: string): Promise<Product> {
  const { data } = await apiClient.get(`/products/${id}`, {
    params: { org_id: orgId },
  })
  return data
}

export async function createProduct(orgId: string, input: ProductCreate): Promise<Product> {
  const { data } = await apiClient.post('/products', input, {
    params: { org_id: orgId },
  })
  return data
}

export async function updateProduct(
  orgId: string,
  id: string,
  input: ProductUpdate,
): Promise<Product> {
  const { data } = await apiClient.put(`/products/${id}`, input, {
    params: { org_id: orgId },
  })
  return data
}

export async function deleteProduct(orgId: string, id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`, {
    params: { org_id: orgId },
  })
}
