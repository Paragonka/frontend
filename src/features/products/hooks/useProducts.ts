import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryRetry } from '@/shared/api/query-retry'
import { useAuthStore } from '@/shared/store/auth'
import * as productsApi from '../api'
import type { ProductFilters, ProductUpdate } from '../types'

export function useProducts(filters: ProductFilters = {}) {
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useQuery({
    queryKey: ['products', orgId, filters],
    queryFn: () => productsApi.getProducts(orgId, filters),
    placeholderData: keepPreviousData,
    enabled: !!orgId,
    retry: queryRetry,
  })
}

export function useProduct(id: string) {
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useQuery({
    queryKey: ['products', orgId, id],
    queryFn: () => productsApi.getProduct(orgId, id),
    enabled: !!orgId && !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: (input: Parameters<typeof productsApi.createProduct>[1]) =>
      productsApi.createProduct(orgId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products', orgId] }),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductUpdate }) =>
      productsApi.updateProduct(orgId, id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products', orgId] }),
  })
}

export function useAllProducts() {
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useQuery({
    queryKey: ['products', orgId, 'all'],
    queryFn: () => productsApi.getAllProducts(orgId),
    enabled: !!orgId,
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(orgId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products', orgId] }),
  })
}
