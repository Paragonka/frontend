import { API_URL, apiClient } from '@/shared/api/client'
import type { Photo, PhotoUploadResponse } from './types'

export function getMediaUrl(key: string, orgId: string): string {
  return `${API_URL}/media/${key}?org_id=${encodeURIComponent(orgId)}`
}

export async function uploadPhoto(
  orgId: string,
  entityType: string,
  entityId: string,
  file: File,
): Promise<PhotoUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post(`/media/upload/${entityType}/${entityId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { org_id: orgId },
  })
  return data
}

export async function listPhotos(
  orgId: string,
  entityType: string,
  entityId: string,
): Promise<Photo[]> {
  const { data } = await apiClient.get(`/media/list/${entityType}/${entityId}`, {
    params: { org_id: orgId },
  })
  return data
}

export async function deleteMedia(orgId: string, key: string): Promise<void> {
  await apiClient.delete(`/media/${key}`, {
    params: { org_id: orgId },
  })
}
