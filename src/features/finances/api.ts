import { apiClient } from '@/shared/api/client'
import type { FinanceSummary, FinanceSummaryParams } from './types'

export async function getFinanceSummary(
  orgId: string,
  params: FinanceSummaryParams = {},
): Promise<FinanceSummary> {
  const { months, dateFrom, dateTo } = params
  const isRange = Boolean(dateFrom && dateTo)

  const query: Record<string, string | number> = { org_id: orgId }
  if (isRange) {
    // A full date range takes precedence over the months preset.
    query.date_from = dateFrom as string
    query.date_to = dateTo as string
  } else {
    query.months = months ?? 12
  }

  const { data } = await apiClient.get('/finances/summary', { params: query })
  return data
}
