import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCurrency } from '@/features/orgs/hooks/useCurrency'
import { usePagination } from '@/shared/hooks/usePagination'
import { formatCurrency, formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Pagination } from '@/shared/ui/pagination'
import { useDeleteOrder, useOrders } from '../hooks/useOrders'
import { OrderStatusBadge } from './OrderStatusBadge'

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest' },
  { value: 'created_at', label: 'Oldest' },
  { value: 'execution_date', label: 'Execution date', arrow: ' ↑' },
  { value: '-execution_date', label: 'Execution date', arrow: ' ↓' },
  { value: 'total', label: 'Total', arrow: ' ↑' },
  { value: '-total', label: 'Total', arrow: ' ↓' },
]

export function OrderList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currency = useCurrency()
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState('-created_at')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const { page, currentCursor, limit, visitedPages, nextPage, prevPage, goToPage, reset } =
    usePagination()

  const deleteOrderMutation = useDeleteOrder()

  const { data, isLoading, isError, error, refetch } = useOrders({
    status: status || undefined,
    execution_date_from: dateFrom || undefined,
    execution_date_to: dateTo || undefined,
    cursor: currentCursor || undefined,
    sort,
    limit,
    include_deleted: includeDeleted,
  })

  const handleDelete = (orderId: string) => {
    if (window.confirm(t('Delete order?'))) {
      deleteOrderMutation.mutate(orderId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <span className="text-sm text-gray-500">{t('Loading...')}</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center max-w-md">
          <p className="text-red-700 font-medium">{t('Failed to load orders')}</p>
          <p className="text-sm text-red-500 mt-1">
            {error instanceof Error
              ? error.message
              : t('Server unavailable. Please try again later.')}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          {t('Retry')}
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">{t('Orders')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('calendar')}>
            {t('Calendar')}
          </Button>
          <Button onClick={() => navigate('new')}>{t('New Order')}</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
        <div className="w-full sm:w-auto">
          <label htmlFor="filter-status" className="block text-sm font-medium mb-1">
            {t('Status')}
          </label>
          <select
            id="filter-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              reset(true)
            }}
            className="border rounded px-3 py-2 w-full sm:w-auto"
          >
            <option value="">{t('All')}</option>
            <option value="draft">{t('Draft')}</option>
            <option value="confirmed">{t('Confirmed')}</option>
            <option value="done">{t('Done')}</option>
            <option value="cancelled">{t('Cancelled')}</option>
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

        <div className="w-full sm:w-auto flex items-end">
          <label
            htmlFor="filter-include-deleted"
            className="flex items-center gap-2 text-sm font-medium cursor-pointer py-2"
          >
            <input
              id="filter-include-deleted"
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => {
                setIncludeDeleted(e.target.checked)
                reset(true)
              }}
              className="h-4 w-4"
            />
            {t('Show deleted')}
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end mb-3">
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value)
            reset(true)
          }}
          className="border rounded px-2 py-1 text-sm"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.label)}
              {opt.arrow ?? ''}
            </option>
          ))}
        </select>
      </div>

      {deleteOrderMutation.error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
        >
          {deleteOrderMutation.error instanceof Error
            ? deleteOrderMutation.error.message
            : t('An unexpected error occurred')}
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">{t('Client')}</th>
              <th className="text-left p-3">{t('Items')}</th>
              <th className="text-left p-3">{t('Status')}</th>
              <th className="text-left p-3">{t('Total')}</th>
              <th className="text-left p-3">{t('Execution date')}</th>
              <th className="text-left p-3">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((order) => {
              const isDeleted = order.is_deleted ?? Boolean(order.deleted_at)
              return (
                <tr
                  key={order.id}
                  className={`border-t hover:bg-gray-50 ${isDeleted ? 'opacity-60' : ''}`}
                >
                  <td className={`p-3 ${isDeleted ? 'line-through' : ''}`}>
                    {order.client_name || '—'}
                  </td>
                  <td className="p-3 text-sm text-gray-600 max-w-[300px] truncate">
                    {order.items && order.items.length > 0
                      ? order.items.map((i) => `${i.name} ×${i.qty}`).join(', ')
                      : `—`}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge
                        status={order.status as 'draft' | 'confirmed' | 'done' | 'cancelled'}
                      />
                      {isDeleted && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                          {t('Deleted')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{formatCurrency(order.total, currency)}</td>
                  <td className="p-3">{formatDate(order.execution_date)}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => navigate(order.id)}
                      className="text-blue-600 hover:underline mr-2"
                    >
                      {t('Details')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(order.id)}
                      className="text-red-600 hover:underline"
                    >
                      {t('Delete')}
                    </button>
                  </td>
                </tr>
              )
            })}
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
