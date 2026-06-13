import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryRetry } from '@/shared/api/query-retry'
import { useAuthStore } from '@/shared/store/auth'
import * as clientsApi from '../api'
import type { ClientFilters, ClientUpdate } from '../types'

export function useClients(filters: ClientFilters = {}) {
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useQuery({
    queryKey: ['clients', orgId, filters],
    queryFn: () => clientsApi.getClients(orgId, filters),
    placeholderData: keepPreviousData,
    enabled: !!orgId,
    retry: queryRetry,
  })
}

export function useClient(id: string) {
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useQuery({
    queryKey: ['clients', orgId, id],
    queryFn: () => clientsApi.getClient(orgId, id),
    enabled: !!orgId && !!id,
  })
}

export function useClientOrders(clientId: string) {
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useQuery({
    queryKey: ['clients', orgId, clientId, 'orders'],
    queryFn: () => clientsApi.getClientOrders(orgId, clientId),
    enabled: !!orgId && !!clientId,
  })
}

export function useAllClients() {
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useQuery({
    queryKey: ['clients', orgId, 'all'],
    queryFn: () => clientsApi.getAllClients(orgId),
    enabled: !!orgId,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: (input: Parameters<typeof clientsApi.createClient>[1]) =>
      clientsApi.createClient(orgId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', orgId] }),
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ClientUpdate }) =>
      clientsApi.updateClient(orgId, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', orgId] }),
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: (id: string) => clientsApi.deleteClient(orgId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', orgId] }),
  })
}
