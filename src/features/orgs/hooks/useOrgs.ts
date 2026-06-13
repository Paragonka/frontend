import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/shared/store/auth'
import * as orgsApi from '../api'
import type { InviteCreateRequest, OrgSettingsUpdate, OrgUpdate } from '../types'

export function useOrgs() {
  return useQuery({
    queryKey: ['orgs'],
    queryFn: orgsApi.getOrgs,
  })
}

export function useCreateOrg() {
  const queryClient = useQueryClient()
  const setCurrentOrg = useAuthStore((s) => s.setCurrentOrg)

  return useMutation({
    mutationFn: orgsApi.createOrg,
    onSuccess: (org) => {
      queryClient.setQueryData<import('@/shared/types').Organization[]>(['orgs'], (old) =>
        old ? [...old, org] : [org],
      )
      setCurrentOrg(org.id)
    },
  })
}

export function useUpdateOrg(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: OrgUpdate) => orgsApi.updateOrg(orgId, input),
    onSuccess: (org) => {
      queryClient.setQueryData<import('@/shared/types').Organization[]>(['orgs'], (old) =>
        old ? old.map((o) => (o.id === org.id ? org : o)) : [org],
      )
    },
  })
}

export function useDeleteOrg() {
  const queryClient = useQueryClient()
  const setCurrentOrg = useAuthStore((s) => s.setCurrentOrg)

  return useMutation({
    mutationFn: orgsApi.deleteOrg,
    onSuccess: (_data, orgId) => {
      queryClient.setQueryData<import('@/shared/types').Organization[]>(['orgs'], (old) =>
        old ? old.filter((o) => o.id !== orgId) : [],
      )
      queryClient.removeQueries({ queryKey: ['orgs', orgId] })
      queryClient.removeQueries({ queryKey: ['org-members', orgId] })
      queryClient.removeQueries({ queryKey: ['org-invites', orgId] })
      if (useAuthStore.getState().currentOrgId === orgId) {
        setCurrentOrg(null)
      }
    },
  })
}

export function useSelectOrg() {
  const setCurrentOrg = useAuthStore((s) => s.setCurrentOrg)

  return (orgId: string) => {
    setCurrentOrg(orgId)
  }
}

export function useOrgSettings(orgId: string) {
  return useQuery({
    queryKey: ['orgs', orgId, 'settings'],
    queryFn: () => orgsApi.getOrgSettings(orgId),
    enabled: !!orgId,
  })
}

export function useUpdateOrgSettings(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: OrgSettingsUpdate) => orgsApi.updateOrgSettings(orgId, input),
    onSuccess: (settings) => {
      queryClient.setQueryData(['orgs', orgId, 'settings'], settings)
    },
  })
}

export function useOrgMembers(orgId: string) {
  return useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => orgsApi.getOrgMembers(orgId),
    enabled: !!orgId,
  })
}

export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => orgsApi.removeOrgMember(orgId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org-members', orgId] }),
  })
}

export function useOrgInvites(orgId: string) {
  return useQuery({
    queryKey: ['org-invites', orgId],
    queryFn: () => orgsApi.getOrgInvites(orgId),
    enabled: !!orgId,
  })
}

export function useCreateInvite(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: InviteCreateRequest) => orgsApi.createOrgInvite(orgId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org-invites', orgId] }),
  })
}

export function useRevokeInvite(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (inviteId: string) => orgsApi.revokeOrgInvite(orgId, inviteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org-invites', orgId] }),
  })
}
