import {
  createClient,
  deleteClient,
  getAllClients,
  getClient,
  getClients,
  updateClient,
} from '@/features/clients/api'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client')

const orgId = 'org-test-123'

describe('Clients API', () => {
  it('getClients builds correct query params', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: { data: [], next_cursor: null } })

    await getClients(orgId, { name: 'Ivan', limit: 10 })
    expect(mockGet).toHaveBeenCalledWith('/clients', {
      params: { org_id: orgId, 'filter[name]': 'Ivan', limit: 10 },
    })
  })

  it('getClients passes cursor param', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: { data: [], next_cursor: null } })

    await getClients(orgId, { cursor: 'abc123', limit: 50 })
    expect(mockGet).toHaveBeenCalledWith('/clients', {
      params: { org_id: orgId, cursor: 'abc123', limit: 50 },
    })
  })

  it('getAllClients calls GET /clients/all', async () => {
    const mockGet = vi.mocked(apiClient.get)
    const clients = [
      { id: '1', org_id: 'o1', name: 'John', surname: 'Doe', phone: '123', notes: '' },
    ]
    mockGet.mockResolvedValue({ data: clients })

    const result = await getAllClients(orgId)
    expect(mockGet).toHaveBeenCalledWith('/clients/all', {
      params: { org_id: orgId },
    })
    expect(result).toEqual(clients)
  })

  it('getClient calls GET /clients/:id', async () => {
    const mockGet = vi.mocked(apiClient.get)
    const client = { id: '1', org_id: 'o1', name: 'John', surname: 'Doe', phone: '123', notes: '' }
    mockGet.mockResolvedValue({ data: client })

    const result = await getClient(orgId, '1')
    expect(mockGet).toHaveBeenCalledWith('/clients/1', {
      params: { org_id: orgId },
    })
    expect(result).toEqual(client)
  })

  it('createClient posts correct data', async () => {
    const mockPost = vi.mocked(apiClient.post)
    const created = { id: '1', name: 'Test', surname: '', phone: '', notes: '', org_id: 'o1' }
    mockPost.mockResolvedValue({ data: created })

    const result = await createClient(orgId, { name: 'Test' })
    expect(mockPost).toHaveBeenCalledWith(
      '/clients',
      { name: 'Test' },
      { params: { org_id: orgId } },
    )
    expect(result).toEqual(created)
  })

  it('updateClient puts correct data', async () => {
    const mockPut = vi.mocked(apiClient.put)
    const updated = { id: '1', org_id: 'o1', name: 'Updated', surname: '', phone: '', notes: '' }
    mockPut.mockResolvedValue({ data: updated })

    const result = await updateClient(orgId, '1', { name: 'Updated' })
    expect(mockPut).toHaveBeenCalledWith(
      '/clients/1',
      { name: 'Updated' },
      { params: { org_id: orgId } },
    )
    expect(result).toEqual(updated)
  })

  it('deleteClient calls DELETE /clients/:id', async () => {
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValue({})

    await deleteClient(orgId, '1')
    expect(mockDelete).toHaveBeenCalledWith('/clients/1', {
      params: { org_id: orgId },
    })
  })
})
