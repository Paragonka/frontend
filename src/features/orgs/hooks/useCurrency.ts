import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/shared/store/auth'
import { getOrgSettings } from '../api'

export const FALLBACK_CURRENCY = 'PLN'

/**
 * Currency of the current organization for money formatting.
 * The org id comes from the zustand store, which RootLayout keeps in sync
 * with the :orgId URL param. Falls back to PLN while loading or when
 * settings are unavailable, so components never block on this query.
 */
export function useCurrency(): string {
  const orgId = useAuthStore((s) => s.currentOrgId)

  const { data } = useQuery({
    queryKey: ['orgs', orgId, 'settings'],
    queryFn: () => getOrgSettings(orgId as string),
    enabled: Boolean(orgId),
    staleTime: 5 * 60 * 1000,
  })

  return data?.currency ?? FALLBACK_CURRENCY
}
