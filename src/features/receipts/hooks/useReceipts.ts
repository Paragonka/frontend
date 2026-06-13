import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryRetry } from '@/shared/api/query-retry'
import { useAuthStore } from '@/shared/store/auth'
import * as receiptsApi from '../api'
import type { ReceiptFilters } from '../types'

export function useReceipts(filters: ReceiptFilters = {}) {
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useQuery({
    queryKey: ['receipts', orgId, filters],
    queryFn: () => receiptsApi.getReceipts(orgId, filters),
    placeholderData: keepPreviousData,
    enabled: !!orgId,
    retry: queryRetry,
  })
}

export function useReceipt(id: string) {
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useQuery({
    queryKey: ['receipts', orgId, id],
    queryFn: () => receiptsApi.getReceipt(orgId, id),
    enabled: !!orgId && !!id,
  })
}

export function useReceiptItems(id: string) {
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useQuery({
    queryKey: ['receipts', orgId, id, 'items'],
    queryFn: () => receiptsApi.getReceiptItems(orgId, id),
    enabled: !!orgId && !!id,
  })
}

export function useCreateReceipt() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: (input: Parameters<typeof receiptsApi.createReceipt>[1]) =>
      receiptsApi.createReceipt(orgId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['receipts', orgId] }),
  })
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: (id: string) => receiptsApi.deleteReceipt(orgId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['receipts', orgId] }),
  })
}
