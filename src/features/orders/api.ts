import { apiClient } from '@/shared/api/client'
import type { PaginatedResponse } from '@/shared/api/types'
import type {
  Order,
  OrderCreate,
  OrderFilters,
  OrderItem,
  OrderItemCreate,
  OrderItemUpdate,
  WriteOffCreate,
  WriteOffResponse,
} from './types'

export async function getOrders(
  orgId: string,
  params: OrderFilters = {},
): Promise<PaginatedResponse<Order>> {
  const query: Record<string, string | number | boolean | undefined> = { org_id: orgId }
  if (params.cursor) query.cursor = params.cursor
  if (params.limit) query.limit = params.limit
  if (params.sort) query.sort = params.sort
  if (params.status) query['filter[status]'] = params.status
  if (params.execution_date_from) query['filter[execution_date_from]'] = params.execution_date_from
  if (params.execution_date_to) query['filter[execution_date_to]'] = params.execution_date_to
  if (params.include_deleted !== undefined) query.include_deleted = params.include_deleted

  const { data } = await apiClient.get('/orders', { params: query })
  return data
}

export async function getOrder(orgId: string, id: string): Promise<Order> {
  const { data } = await apiClient.get(`/orders/${id}`, {
    params: { org_id: orgId },
  })
  return data
}

export async function createOrder(orgId: string, input: OrderCreate): Promise<Order> {
  const { data } = await apiClient.post('/orders', input, {
    params: { org_id: orgId },
  })
  return data
}

export async function addOrderItem(
  orgId: string,
  orderId: string,
  input: OrderItemCreate,
): Promise<OrderItem> {
  const { data } = await apiClient.post(`/orders/${orderId}/items`, input, {
    params: { org_id: orgId },
  })
  return data
}

export async function updateOrderItem(
  orgId: string,
  orderId: string,
  itemId: string,
  input: OrderItemUpdate,
): Promise<OrderItem> {
  const { data } = await apiClient.patch(`/orders/${orderId}/items/${itemId}`, input, {
    params: { org_id: orgId },
  })
  return data
}

export async function removeOrderItem(
  orgId: string,
  orderId: string,
  itemId: string,
): Promise<void> {
  await apiClient.delete(`/orders/${orderId}/items/${itemId}`, {
    params: { org_id: orgId },
  })
}

export async function changeOrderStatus(
  orgId: string,
  orderId: string,
  status: string,
): Promise<Order> {
  const { data } = await apiClient.post(
    `/orders/${orderId}/status`,
    { status },
    {
      params: { org_id: orgId },
    },
  )
  return data
}

export async function deleteOrder(orgId: string, orderId: string): Promise<void> {
  await apiClient.delete(`/orders/${orderId}`, {
    params: { org_id: orgId },
  })
}

export async function createWriteOff(
  orgId: string,
  orderId: string,
  input: WriteOffCreate,
): Promise<WriteOffResponse> {
  const { data } = await apiClient.post(`/orders/${orderId}/write-offs`, input, {
    params: { org_id: orgId },
  })
  return data
}
