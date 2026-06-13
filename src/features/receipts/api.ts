import { apiClient } from '@/shared/api/client'
import type { PaginatedResponse } from '@/shared/api/types'
import type { Receipt, ReceiptCreate, ReceiptFilters, ReceiptItem } from './types'

export async function getReceipts(
  orgId: string,
  params: ReceiptFilters = {},
): Promise<PaginatedResponse<Receipt>> {
  const query: Record<string, string | number | undefined> = { org_id: orgId }
  if (params.cursor) query.cursor = params.cursor
  if (params.limit) query.limit = params.limit
  if (params.date_from) query['filter[date_from]'] = params.date_from
  if (params.date_to) query['filter[date_to]'] = params.date_to
  if (params.source) query['filter[source]'] = params.source
  if (params.client_id) query['filter[client_id]'] = params.client_id

  const { data } = await apiClient.get('/receipts', { params: query })
  return data
}

export async function getReceipt(orgId: string, id: string): Promise<Receipt> {
  const { data } = await apiClient.get(`/receipts/${id}`, {
    params: { org_id: orgId },
  })
  return data
}

export async function createReceipt(orgId: string, input: ReceiptCreate): Promise<Receipt> {
  const { data } = await apiClient.post('/receipts', input, {
    params: { org_id: orgId },
  })
  return data
}

export async function deleteReceipt(orgId: string, id: string): Promise<void> {
  await apiClient.delete(`/receipts/${id}`, {
    params: { org_id: orgId },
  })
}

export async function getReceiptItems(orgId: string, id: string): Promise<ReceiptItem[]> {
  const { data } = await apiClient.get(`/receipts/${id}/items`, {
    params: { org_id: orgId },
  })
  return data
}
