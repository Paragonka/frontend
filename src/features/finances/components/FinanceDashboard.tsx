import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '@/features/orgs/hooks/useCurrency'
import { formatCurrency } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { useFinanceSummary } from '../hooks/useFinances'
import { FinanceChart } from './FinanceChart'

const PERIOD_OPTIONS = [3, 6, 12, 24]

export function FinanceDashboard() {
  const { t } = useTranslation()
  const currency = useCurrency()
  const [months, setMonths] = useState(12)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const useRange = Boolean(dateFrom && dateTo)
  const onlyOneDate = (dateFrom && !dateTo) || (!dateFrom && dateTo)

  const { data, isLoading } = useFinanceSummary(useRange ? { dateFrom, dateTo } : { months })

  function selectPreset(option: number) {
    setMonths(option)
    setDateFrom('')
    setDateTo('')
  }

  if (isLoading) {
    return <div className="p-6">{t('Loading...')}</div>
  }

  if (!data) {
    return <div className="p-6">{t('No financial data available')}</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">{t('Finances')}</h1>

      <fieldset className="m-0 flex items-center gap-2 border-0 p-0">
        <legend className="sr-only">{t('Period')}</legend>
        {PERIOD_OPTIONS.map((option) => {
          const isActive = !useRange && option === months
          return (
            <Button
              key={option}
              type="button"
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => selectPreset(option)}
              aria-pressed={isActive}
            >
              {t(`${option} months`)}
            </Button>
          )
        })}
      </fieldset>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="finance-date-from" className="block text-sm font-medium mb-1">
            {t('Date from')}
          </label>
          <input
            id="finance-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="finance-date-to" className="block text-sm font-medium mb-1">
            {t('Date to')}
          </label>
          <input
            id="finance-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        {onlyOneDate && (
          <p className="text-sm text-amber-600" role="note">
            {t('Fill in both dates to filter by range')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">{t('Total Revenue')}</p>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(data.total_revenue, currency)}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{t('Total Expenses')}</p>
          <p className="text-2xl font-bold text-red-900">
            {formatCurrency(data.total_expenses, currency)}
          </p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">{t('Profit / Loss')}</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(data.total_pnl, currency)}
          </p>
        </div>
      </div>

      <FinanceChart data={data.monthly} />
    </div>
  )
}
