import { getFinanceSummary } from '@/features/finances/api'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client')

const orgId = 'org-test-123'

describe('Finances API', () => {
  it('getFinanceSummary calls GET /finances/summary', async () => {
    const mockGet = vi.mocked(apiClient.get)
    const summary = {
      total_revenue: 50000,
      total_expenses: 30000,
      total_pnl: 20000,
      monthly: [
        { month: '2025-01', revenue: 10000, expenses: 5000, pnl: 5000 },
        { month: '2025-02', revenue: 12000, expenses: 6000, pnl: 6000 },
      ],
      from_month: '2025-01',
      to_month: '2025-02',
    }
    mockGet.mockResolvedValue({ data: summary })

    const result = await getFinanceSummary(orgId, { months: 2 })
    expect(mockGet).toHaveBeenCalledWith('/finances/summary', {
      params: { org_id: orgId, months: 2 },
    })
    expect(result).toEqual(summary)
  })

  it('getFinanceSummary defaults months to 12', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({
      data: {
        total_revenue: 0,
        total_expenses: 0,
        total_pnl: 0,
        monthly: [],
        from_month: null,
        to_month: null,
      },
    })

    await getFinanceSummary(orgId, {})
    expect(mockGet).toHaveBeenCalledWith('/finances/summary', {
      params: { org_id: orgId, months: 12 },
    })
  })

  it('getFinanceSummary sends date_from/date_to when both dates are provided', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({
      data: {
        total_revenue: 0,
        total_expenses: 0,
        total_pnl: 0,
        monthly: [],
        from_month: '2025-01',
        to_month: '2025-03',
      },
    })

    await getFinanceSummary(orgId, { dateFrom: '2025-01-01', dateTo: '2025-03-31' })
    expect(mockGet).toHaveBeenCalledWith('/finances/summary', {
      params: { org_id: orgId, date_from: '2025-01-01', date_to: '2025-03-31' },
    })
  })

  it('getFinanceSummary does not send date params when only one date is provided', async () => {
    const mockGet = vi.mocked(apiClient.get)
    mockGet.mockResolvedValue({
      data: {
        total_revenue: 0,
        total_expenses: 0,
        total_pnl: 0,
        monthly: [],
        from_month: null,
        to_month: null,
      },
    })

    await getFinanceSummary(orgId, { dateFrom: '2025-01-01' })
    expect(mockGet).toHaveBeenCalledWith('/finances/summary', {
      params: { org_id: orgId, months: 12 },
    })
  })
})
