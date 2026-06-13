import {
  createOrg,
  createOrgInvite,
  deleteOrg,
  getOrgInvites,
  getOrgMembers,
  getOrgSettings,
  getOrgs,
  removeOrgMember,
  revokeOrgInvite,
  updateOrg,
  updateOrgSettings,
} from '@/features/orgs/api'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client')

describe('Orgs API', () => {
  it('getOrgs calls GET /orgs', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({
      data: [{ id: 'org-1', name: 'Test Org', owner_id: '1', timezone: 'UTC' }],
    })

    const result = await getOrgs()
    expect(mockGet).toHaveBeenCalledWith('/orgs')
    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('Test Org')
  })

  it('createOrg posts to /orgs', async () => {
    const mockPost = vi.mocked(apiClient.post)
    mockPost.mockResolvedValue({
      data: { id: 'org-1', name: 'New Org', owner_id: '1', timezone: 'UTC' },
    })

    const result = await createOrg({ name: 'New Org' })
    expect(mockPost).toHaveBeenCalledWith('/orgs', { name: 'New Org' })
    expect(result.name).toBe('New Org')
  })

  it('updateOrg patches to /orgs/:id', async () => {
    const mockPatch = vi.mocked(apiClient.patch)
    mockPatch.mockResolvedValue({
      data: { id: 'org-1', name: 'Renamed Org', owner_id: '1', timezone: 'UTC' },
    })

    const result = await updateOrg('org-1', { name: 'Renamed Org' })
    expect(mockPatch).toHaveBeenCalledWith('/orgs/org-1', { name: 'Renamed Org' })
    expect(result.name).toBe('Renamed Org')
  })

  it('deleteOrg calls DELETE /orgs/:id', async () => {
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValue({ data: '' })

    await deleteOrg('org-1')
    expect(mockDelete).toHaveBeenCalledWith('/orgs/org-1')
  })

  it('getOrgSettings calls GET /orgs/:id/settings', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({ data: { currency: 'PLN' } })

    const result = await getOrgSettings('org-1')
    expect(mockGet).toHaveBeenCalledWith('/orgs/org-1/settings')
    expect(result.currency).toBe('PLN')
  })

  it('updateOrgSettings puts to /orgs/:id/settings', async () => {
    const mockPut = vi.mocked(apiClient.put)
    mockPut.mockResolvedValue({ data: { currency: 'EUR' } })

    const result = await updateOrgSettings('org-1', { currency: 'EUR' })
    expect(mockPut).toHaveBeenCalledWith('/orgs/org-1/settings', { currency: 'EUR' })
    expect(result.currency).toBe('EUR')
  })

  it('getOrgMembers calls GET /orgs/:id/members', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({
      data: [{ user_id: 'u1', email: 'a@t.io', full_name: 'Alice', role: 'owner' }],
    })

    const result = await getOrgMembers('org-1')
    expect(mockGet).toHaveBeenCalledWith('/orgs/org-1/members')
    expect(result[0]?.role).toBe('owner')
  })

  it('removeOrgMember calls DELETE /orgs/:id/members/:userId', async () => {
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValue({ data: '' })

    await removeOrgMember('org-1', 'u2')
    expect(mockDelete).toHaveBeenCalledWith('/orgs/org-1/members/u2')
  })

  it('getOrgInvites calls GET /orgs/:id/invites', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({
      data: [{ invite_id: 'i1', email: 'b@t.io', token: 'tok', expires_at: null }],
    })

    const result = await getOrgInvites('org-1')
    expect(mockGet).toHaveBeenCalledWith('/orgs/org-1/invites')
    expect(result[0]?.token).toBe('tok')
  })

  it('createOrgInvite posts to /orgs/:id/invites', async () => {
    const mockPost = vi.mocked(apiClient.post)
    mockPost.mockResolvedValue({
      data: { invite_id: 'i2', token: 'tok2', expires_at: null },
    })

    const result = await createOrgInvite('org-1', { email: 'b@t.io' })
    expect(mockPost).toHaveBeenCalledWith('/orgs/org-1/invites', { email: 'b@t.io' })
    expect(result.token).toBe('tok2')
  })

  it('revokeOrgInvite calls DELETE /orgs/:id/invites/:inviteId', async () => {
    const mockDelete = vi.mocked(apiClient.delete)
    mockDelete.mockResolvedValue({ data: '' })

    await revokeOrgInvite('org-1', 'i1')
    expect(mockDelete).toHaveBeenCalledWith('/orgs/org-1/invites/i1')
  })
})
