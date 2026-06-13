import type { Order } from '@/features/orders/types'
import { apiClient } from '@/shared/api/client'
import type { PaginatedResponse } from '@/shared/api/types'
import type { Client, ClientCreate, ClientFilters, ClientUpdate } from './types'

export async function getClients(
  orgId: string,
  params: ClientFilters,
): Promise<PaginatedResponse<Client>> {
  const query: Record<string, string | number | undefined> = { org_id: orgId }
  if (params.cursor) query.cursor = params.cursor
  if (params.limit) query.limit = params.limit
  if (params.sort) query.sort = params.sort
  if (params.name) query['filter[name]'] = params.name
  if (params.surname) query['filter[surname]'] = params.surname
  if (params.phone) query['filter[phone]'] = params.phone

  const { data } = await apiClient.get('/clients', { params: query })
  return data
}

export async function getAllClients(orgId: string): Promise<Client[]> {
  const { data } = await apiClient.get('/clients/all', { params: { org_id: orgId } })
  return data
}

export async function getClient(orgId: string, id: string): Promise<Client> {
  const { data } = await apiClient.get(`/clients/${id}`, {
    params: { org_id: orgId },
  })
  return data
}

export async function getClientOrders(orgId: string, id: string): Promise<Order[]> {
  const { data } = await apiClient.get(`/clients/${id}/orders`, {
    params: { org_id: orgId },
  })
  return data
}

export async function createClient(orgId: string, input: ClientCreate): Promise<Client> {
  const { data } = await apiClient.post('/clients', input, {
    params: { org_id: orgId },
  })
  return data
}

export async function updateClient(
  orgId: string,
  id: string,
  input: ClientUpdate,
): Promise<Client> {
  const { data } = await apiClient.put(`/clients/${id}`, input, {
    params: { org_id: orgId },
  })
  return data
}

export async function deleteClient(orgId: string, id: string): Promise<void> {
  await apiClient.delete(`/clients/${id}`, {
    params: { org_id: orgId },
  })
}
