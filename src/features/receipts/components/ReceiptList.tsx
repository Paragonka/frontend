import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCurrency } from '@/features/orgs/hooks/useCurrency'
import { usePagination } from '@/shared/hooks/usePagination'
import { formatCurrency, formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Pagination } from '@/shared/ui/pagination'
import { useReceipts } from '../hooks/useReceipts'

export function ReceiptList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currency = useCurrency()
  const [source, setSource] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const { page, currentCursor, limit, visitedPages, nextPage, prevPage, goToPage, reset } =
    usePagination()

  const { data, isLoading } = useReceipts({
    source: source || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    cursor: currentCursor || undefined,
    limit,
  })

  if (isLoading) return <div>{t('Loading...')}</div>

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">{t('Receipts')}</h1>
        <Button onClick={() => navigate('new')}>{t('New Receipt')}</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
        <div className="w-full sm:w-auto">
          <label htmlFor="filter-source" className="block text-sm font-medium mb-1">
            {t('Source')}
          </label>
          <select
            id="filter-source"
            value={source}
            onChange={(e) => {
              setSource(e.target.value)
              reset(true)
            }}
            className="border rounded px-3 py-2 w-full sm:w-auto"
          >
            <option value="">{t('All')}</option>
            <option value="jpk">JPK</option>
            <option value="manual">{t('Manual')}</option>
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <label htmlFor="filter-date-from" className="block text-sm font-medium mb-1">
            {t('Date from')}
          </label>
          <input
            id="filter-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              reset(true)
            }}
            className="border rounded px-3 py-2 w-full sm:w-auto"
          />
        </div>

        <div className="w-full sm:w-auto">
          <label htmlFor="filter-date-to" className="block text-sm font-medium mb-1">
            {t('Date to')}
          </label>
          <input
            id="filter-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              reset(true)
            }}
            className="border rounded px-3 py-2 w-full sm:w-auto"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 whitespace-nowrap">{t('Receipt')}</th>
              <th className="text-left p-3 whitespace-nowrap">{t('Date')}</th>
              <th className="text-left p-3 whitespace-nowrap">{t('Total')}</th>
              <th className="text-left p-3 whitespace-nowrap">{t('Source')}</th>
              <th className="text-left p-3 whitespace-nowrap">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((receipt) => (
              <tr key={receipt.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-mono text-sm whitespace-nowrap">{receipt.id}</td>
                <td className="p-3 whitespace-nowrap">{formatDate(receipt.receipt_date)}</td>
                <td className="p-3 whitespace-nowrap">{formatCurrency(receipt.total, currency)}</td>
                <td className="p-3 whitespace-nowrap">{receipt.source || '-'}</td>
                <td className="p-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => navigate(receipt.id)}
                    className="text-blue-600 hover:underline mr-2"
                  >
                    {t('Details')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        total={data?.total ?? 0}
        limit={limit}
        visitedPages={visitedPages}
        onNext={() => {
          if (data?.next_cursor) nextPage(data.next_cursor)
        }}
        onPrev={prevPage}
        onGoToPage={goToPage}
      />
    </div>
  )
}
