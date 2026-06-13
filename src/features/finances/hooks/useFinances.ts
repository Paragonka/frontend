import { useQuery } from '@tanstack/react-query'
import { queryRetry } from '@/shared/api/query-retry'
import { useAuthStore } from '@/shared/store/auth'
import { getFinanceSummary } from '../api'
import type { FinanceSummaryParams } from '../types'

export function useFinanceSummary(params: FinanceSummaryParams = {}) {
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''

  // A full date range takes precedence over the months preset. Normalise the
  // effective params so the queryKey stays stable and react-query refetches
  // when either the range or the preset changes.
  const effective: FinanceSummaryParams =
    params.dateFrom && params.dateTo
      ? { months: undefined, dateFrom: params.dateFrom, dateTo: params.dateTo }
      : { months: params.months ?? 12 }

  return useQuery({
    queryKey: ['finances', orgId, effective],
    queryFn: () => getFinanceSummary(orgId, effective),
    enabled: !!orgId,
    retry: queryRetry,
  })
}
