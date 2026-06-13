import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { FinanceDashboard } from '@/features/finances/components/FinanceDashboard'

const mockSummary = {
  total_revenue: 50000,
  total_expenses: 30000,
  total_pnl: 20000,
  monthly: [
    { month: '2025-01', revenue: 10000, expenses: 5000, pnl: 5000 },
    { month: '2025-02', revenue: 12000, expenses: 6000, pnl: 6000 },
    { month: '2025-03', revenue: 15000, expenses: 8000, pnl: 7000 },
  ],
  from_month: '2025-01',
  to_month: '2025-03',
}

/*
 * happy-dom does not implement ResizeObserver. Without it, recharts'
 * ResponsiveContainer returns early and never measures the container.
 * Provide a minimal stub so the container mounts (happy-dom layout still
 * reports 0x0, which is fine for asserting on the mount-time dimension).
 */
beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

let mockUseFinanceSummary: {
  data: typeof mockSummary | undefined
  isLoading: boolean
} = {
  data: mockSummary,
  isLoading: false,
}

let mockUseFinanceParams: Record<string, unknown> = {}

vi.mock('@/features/finances/hooks/useFinances', () => ({
  useFinanceSummary: (params: Record<string, unknown>) => {
    mockUseFinanceParams = params
    return mockUseFinanceSummary
  },
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('FinanceDashboard', () => {
  beforeEach(() => {
    mockUseFinanceSummary = { data: mockSummary, isLoading: false }
    mockUseFinanceParams = {}
  })

  it('renders page title', () => {
    render(<FinanceDashboard />, { wrapper: Wrapper })
    expect(screen.getByText('Finances')).toBeInTheDocument()
  })

  it('renders revenue metric', () => {
    render(<FinanceDashboard />, { wrapper: Wrapper })
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes('50'))).toBeInTheDocument()
  })

  it('renders expenses metric', () => {
    render(<FinanceDashboard />, { wrapper: Wrapper })
    expect(screen.getByText('Total Expenses')).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes('30'))).toBeInTheDocument()
  })

  it('renders profit/loss metric', () => {
    render(<FinanceDashboard />, { wrapper: Wrapper })
    // The chart legend also renders a "Profit / Loss" text, so scope the
    // lookup to the metric card (the <p> inside the stats grid) that
    // contains the currency amount.
    const label = screen.getAllByText('Profit / Loss').find((el) => el.tagName === 'P')
    expect(label).toBeInTheDocument()
    const pnlCard = label?.closest('div') as HTMLElement
    expect(pnlCard.textContent).toContain('20')
  })

  it('renders the chart container', () => {
    render(<FinanceDashboard />, { wrapper: Wrapper })
    expect(screen.getByTestId('finance-chart')).toBeInTheDocument()
  })

  it('renders the chart without the -1x-1 dimension warning on mount', () => {
    // Regression: recharts' ResponsiveContainer defaults initialDimension to
    // {width:-1, height:-1}, which emits "The width(-1) and height(-1) of
    // chart should be greater than 0" on the very first render (before the
    // ResizeObserver/layout effect fires). A positive initialDimension
    // removes exactly that warning. happy-dom reports a 0x0 layout which is a
    // test-only artifact and is NOT what this assertion targets.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<FinanceDashboard />, { wrapper: Wrapper })
    const mountWarnings = warnSpy.mock.calls
      .map((call) => call.join(' '))
      .filter((message) => message.includes('-1') || message.includes('chart should be greater'))
    expect(mountWarnings.some((message) => message.includes('width(-1)'))).toBe(false)
    warnSpy.mockRestore()
  })

  it('renders period selector buttons for 3/6/12/24 months', () => {
    render(<FinanceDashboard />, { wrapper: Wrapper })
    expect(screen.getByRole('group', { name: 'Period' })).toBeInTheDocument()
    for (const months of ['3 months', '6 months', '12 months', '24 months']) {
      expect(screen.getByRole('button', { name: months })).toBeInTheDocument()
    }
  })

  it('defaults to the 12 months period being active', () => {
    render(<FinanceDashboard />, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: '12 months' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '6 months' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('switches the active period when a button is clicked', () => {
    render(<FinanceDashboard />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: '6 months' }))
    expect(screen.getByRole('button', { name: '6 months' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '12 months' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('shows loading state', () => {
    mockUseFinanceSummary = { data: undefined, isLoading: true }
    render(<FinanceDashboard />, { wrapper: Wrapper })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    mockUseFinanceSummary = { data: undefined, isLoading: false }
    render(<FinanceDashboard />, { wrapper: Wrapper })
    expect(screen.getByText('No financial data available')).toBeInTheDocument()
  })

  it('renders date range inputs', () => {
    render(<FinanceDashboard />, { wrapper: Wrapper })
    expect(screen.getByLabelText('Date from')).toBeInTheDocument()
    expect(screen.getByLabelText('Date to')).toBeInTheDocument()
  })

  it('passes months params by default', () => {
    render(<FinanceDashboard />, { wrapper: Wrapper })
    expect(mockUseFinanceParams).toEqual({ months: 12 })
  })

  it('passes months params when a preset is clicked and clears dates', () => {
    render(<FinanceDashboard />, { wrapper: Wrapper })
    const dateFrom = screen.getByLabelText('Date from')
    const dateTo = screen.getByLabelText('Date to')

    // Set both dates first so the range branch is taken.
    fireEvent.change(dateFrom, { target: { value: '2025-01-01' } })
    fireEvent.change(dateTo, { target: { value: '2025-03-31' } })
    expect(mockUseFinanceParams).toEqual({
      dateFrom: '2025-01-01',
      dateTo: '2025-03-31',
    })

    // Clicking a preset clears the dates and falls back to months.
    fireEvent.click(screen.getByRole('button', { name: '6 months' }))
    expect(mockUseFinanceParams).toEqual({ months: 6 })
    expect(dateFrom).toHaveValue('')
    expect(dateTo).toHaveValue('')
  })

  it('sends date_from/date_to when both dates are set', () => {
    render(<FinanceDashboard />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText('Date from'), { target: { value: '2025-01-01' } })
    fireEvent.change(screen.getByLabelText('Date to'), { target: { value: '2025-03-31' } })
    expect(mockUseFinanceParams).toEqual({
      dateFrom: '2025-01-01',
      dateTo: '2025-03-31',
    })
  })

  it('does not change the query when only one date is set', () => {
    render(<FinanceDashboard />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText('Date from'), { target: { value: '2025-01-01' } })
    // Only date_from filled — falls back to months.
    expect(mockUseFinanceParams).toEqual({ months: 12 })
    expect(screen.getByText('Fill in both dates to filter by range')).toBeInTheDocument()
  })

  it('deactivates presets when a date range is active', () => {
    render(<FinanceDashboard />, { wrapper: Wrapper })
    fireEvent.change(screen.getByLabelText('Date from'), { target: { value: '2025-01-01' } })
    fireEvent.change(screen.getByLabelText('Date to'), { target: { value: '2025-03-31' } })
    expect(screen.getByRole('button', { name: '12 months' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})
