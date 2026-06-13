import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryRetry } from '@/shared/api/query-retry'
import { useAuthStore } from '@/shared/store/auth'
import * as eavApi from '../api'
import type { EavAttributeCreate } from '../types'

export function useEavAttributes(entityCode?: string) {
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useQuery({
    queryKey: ['eav-attributes', orgId, entityCode],
    queryFn: () => eavApi.getEavAttributes(orgId, entityCode),
    enabled: !!orgId,
    retry: queryRetry,
  })
}

export function useCreateEavAttribute() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: (input: EavAttributeCreate) => eavApi.createEavAttribute(orgId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['eav-attributes'] }),
  })
}

export function useDeleteEavAttribute() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: (id: string) => eavApi.deleteEavAttribute(orgId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['eav-attributes'] }),
  })
}
