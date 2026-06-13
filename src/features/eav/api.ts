import { apiClient } from '@/shared/api/client'
import type { EavAttribute, EavAttributeCreate } from './types'

export async function getEavAttributes(
  orgId: string,
  entityCode?: string,
): Promise<EavAttribute[]> {
  const { data } = await apiClient.get('/eav/attributes', {
    params: { org_id: orgId, entity_code: entityCode ?? '' },
  })
  return data
}

export async function createEavAttribute(
  orgId: string,
  input: EavAttributeCreate,
): Promise<EavAttribute> {
  const { data } = await apiClient.post('/eav/attributes', input, {
    params: { org_id: orgId },
  })
  return data
}

export async function deleteEavAttribute(orgId: string, id: string): Promise<void> {
  await apiClient.delete(`/eav/attributes/${id}`, {
    params: { org_id: orgId },
  })
}
