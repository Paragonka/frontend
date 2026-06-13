import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/shared/store/auth'
import * as mediaApi from '../api'

export function useUploadPhoto() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      file,
    }: {
      entityType: string
      entityId: string
      file: File
    }) => mediaApi.uploadPhoto(orgId, entityType, entityId, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['media', orgId, variables.entityType, variables.entityId],
      })
    },
  })
}

export function useEntityPhotos(entityType: string, entityId: string) {
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useQuery({
    queryKey: ['media', orgId, entityType, entityId],
    queryFn: () => mediaApi.listPhotos(orgId, entityType, entityId),
    enabled: !!orgId && !!entityType && !!entityId,
  })
}

export function useDeleteMedia() {
  const queryClient = useQueryClient()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  return useMutation({
    mutationFn: (key: string) => mediaApi.deleteMedia(orgId, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
  })
}
