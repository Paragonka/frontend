export interface FinanceMonthly {
  month: string
  revenue: number
  expenses: number
  pnl: number
}

export interface FinanceSummary {
  total_revenue: number
  total_expenses: number
  total_pnl: number
  monthly: FinanceMonthly[]
  from_month: string | null
  to_month: string | null
}

export interface FinanceSummaryParams {
  months?: number
  dateFrom?: string
  dateTo?: string
}
