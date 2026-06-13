import { deleteMedia, getMediaUrl, listPhotos, uploadPhoto } from '@/features/media/api'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/client')>()
  return { ...actual, apiClient: { post: vi.fn(), get: vi.fn(), delete: vi.fn() } }
})

const orgId = 'org-test-123'

describe('Media API', () => {
  it('uploadPhoto sends file as multipart and returns key-only response', async () => {
    const mockPost = vi.mocked(apiClient.post)
    const response = { key: 'photo-1' }
    mockPost.mockResolvedValue({ data: response })

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    const result = await uploadPhoto(orgId, 'products', 'p1', file)

    expect(mockPost).toHaveBeenCalledWith('/media/upload/products/p1', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { org_id: orgId },
    })
    expect(result).toEqual(response)
  })

  it('listPhotos calls GET /media/list/:entityType/:entityId with org_id', async () => {
    const mockGet = vi.mocked(apiClient.get)
    const photos = [{ key: 'photo-1' }, { key: 'photo-2' }]
    mockGet.mockResolvedValue({ data: photos })

    const result = await listPhotos(orgId, 'orders', 'o1')
    expect(mockGet).toHaveBeenCalledWith('/media/list/orders/o1', {
      params: { org_id: orgId },
    })
    expect(result).toEqual(photos)
    expect(Object.keys(result[0] as object)).toEqual(['key'])
  })

  it('deleteMedia calls DELETE /media/:key', async () => {
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValue({})

    await deleteMedia(orgId, 'photo-1')
    expect(mockDelete).toHaveBeenCalledWith('/media/photo-1', {
      params: { org_id: orgId },
    })
  })

  it('getMediaUrl builds API media URL with org_id query', () => {
    const url = getMediaUrl('org-1/clients/c1/photo.jpg', orgId)
    expect(url).toBe(`/api/v1/media/org-1/clients/c1/photo.jpg?org_id=${orgId}`)
  })
})
