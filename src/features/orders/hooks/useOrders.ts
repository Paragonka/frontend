import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryRetry } from '@/shared/api/query-retry'
import { useAuthStore } from '@/shared/store/auth'
import * as ordersApi from '../api'
import type { OrderFilters, OrderItemCreate, OrderItemUpdate, WriteOffCreate } from '../types'

export function useOrders(filters: OrderFilters = {}) {
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useQuery({
    queryKey: ['orders', orgId, filters],
    queryFn: () => ordersApi.getOrders(orgId, filters),
    placeholderData: keepPreviousData,
    enabled: !!orgId,
    retry: queryRetry,
  })
}

export function useOrder(id: string) {
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useQuery({
    queryKey: ['orders', orgId, id],
    queryFn: () => ordersApi.getOrder(orgId, id),
    enabled: !!orgId && !!id,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: (input: Parameters<typeof ordersApi.createOrder>[1]) =>
      ordersApi.createOrder(orgId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', orgId] }),
  })
}

export function useAddOrderItem() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: OrderItemCreate }) =>
      ordersApi.addOrderItem(orgId, orderId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', orgId] }),
  })
}

export function useUpdateOrderItem() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: ({
      orderId,
      itemId,
      input,
    }: {
      orderId: string
      itemId: string
      input: OrderItemUpdate
    }) => ordersApi.updateOrderItem(orgId, orderId, itemId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', orgId] }),
  })
}

export function useRemoveOrderItem() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: string; itemId: string }) =>
      ordersApi.removeOrderItem(orgId, orderId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', orgId] }),
  })
}

export function useDeleteOrder() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: (orderId: string) => ordersApi.deleteOrder(orgId, orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', orgId] }),
  })
}

export function useChangeOrderStatus() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      ordersApi.changeOrderStatus(orgId, orderId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', orgId] }),
  })
}

export function useCreateWriteOff() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: WriteOffCreate }) =>
      ordersApi.createWriteOff(orgId, orderId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', orgId] }),
  })
}
