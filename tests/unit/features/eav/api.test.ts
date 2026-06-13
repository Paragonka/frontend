import { createEavAttribute, deleteEavAttribute, getEavAttributes } from '@/features/eav/api'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client')

describe('EAV Attributes API', () => {
  it('getEavAttributes calls GET /eav/attributes with org_id and entity_code', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: [] })

    await getEavAttributes('org-1', 'client')
    expect(mockGet).toHaveBeenCalledWith('/eav/attributes', {
      params: { org_id: 'org-1', entity_code: 'client' },
    })
  })

  it('getEavAttributes calls without entity_code when not provided', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: [] })

    await getEavAttributes('org-1')
    expect(mockGet).toHaveBeenCalledWith('/eav/attributes', {
      params: { org_id: 'org-1', entity_code: '' },
    })
  })

  it('createEavAttribute posts correct data', async () => {
    const mockPost = vi.mocked(apiClient.post)
    const created = {
      id: 'attr-1',
      org_id: 'org-1',
      entity_code: 'client' as const,
      code: 'instagram',
      name: 'Instagram',
      field_type: 'string' as const,
      is_required: false,
      default_value: '',
    }
    mockPost.mockResolvedValue({ data: created })

    const result = await createEavAttribute('org-1', {
      entity_code: 'client',
      code: 'instagram',
      name: 'Instagram',
    })
    expect(mockPost).toHaveBeenCalledWith(
      '/eav/attributes',
      {
        entity_code: 'client',
        code: 'instagram',
        name: 'Instagram',
      },
      { params: { org_id: 'org-1' } },
    )
    expect(result).toEqual(created)
  })

  it('deleteEavAttribute calls DELETE /eav/attributes/:id', async () => {
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValue({})

    await deleteEavAttribute('org-1', 'attr-1')
    expect(mockDelete).toHaveBeenCalledWith('/eav/attributes/attr-1', {
      params: { org_id: 'org-1' },
    })
  })
})
