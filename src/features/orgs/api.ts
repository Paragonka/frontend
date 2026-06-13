import { apiClient } from '@/shared/api/client'
import type { Organization, OrganizationSettings } from '@/shared/types'
import type {
  ActiveInvite,
  InviteCreatedResponse,
  InviteCreateRequest,
  OrgCreate,
  OrgMember,
  OrgSettingsUpdate,
  OrgUpdate,
} from './types'

export async function getOrgs(): Promise<Organization[]> {
  const { data } = await apiClient.get('/orgs')
  return data
}

export async function createOrg(input: OrgCreate): Promise<Organization> {
  const { data } = await apiClient.post('/orgs', input)
  return data
}

export async function updateOrg(orgId: string, input: OrgUpdate): Promise<Organization> {
  const { data } = await apiClient.patch(`/orgs/${orgId}`, input)
  return data
}

export async function deleteOrg(orgId: string): Promise<void> {
  await apiClient.delete(`/orgs/${orgId}`)
}

export async function getOrgSettings(orgId: string): Promise<OrganizationSettings> {
  const { data } = await apiClient.get(`/orgs/${orgId}/settings`)
  return data
}

export async function updateOrgSettings(
  orgId: string,
  input: OrgSettingsUpdate,
): Promise<OrganizationSettings> {
  const { data } = await apiClient.put(`/orgs/${orgId}/settings`, input)
  return data
}

export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const { data } = await apiClient.get(`/orgs/${orgId}/members`)
  return data
}

export async function removeOrgMember(orgId: string, userId: string): Promise<void> {
  await apiClient.delete(`/orgs/${orgId}/members/${userId}`)
}

export async function getOrgInvites(orgId: string): Promise<ActiveInvite[]> {
  const { data } = await apiClient.get(`/orgs/${orgId}/invites`)
  return data
}

export async function createOrgInvite(
  orgId: string,
  input: InviteCreateRequest,
): Promise<InviteCreatedResponse> {
  const { data } = await apiClient.post(`/orgs/${orgId}/invites`, input)
  return data
}

export async function revokeOrgInvite(orgId: string, inviteId: string): Promise<void> {
  await apiClient.delete(`/orgs/${orgId}/invites/${inviteId}`)
}
