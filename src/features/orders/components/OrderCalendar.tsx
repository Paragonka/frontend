import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCurrency } from '@/features/orgs/hooks/useCurrency'
import { formatCurrency, formatDateOnly } from '@/shared/lib/format'
import { useAuthStore } from '@/shared/store/auth'
import { Button } from '@/shared/ui/button'
import { useOrders } from '../hooks/useOrders'
import type { Order } from '../types'
import { OrderStatusBadge } from './OrderStatusBadge'

export function OrderCalendar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentOrgId = useAuthStore((s) => s.currentOrgId)
  const currency = useCurrency()
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const monthStart = new Date(currentYear, currentMonth, 1)
  const monthEnd = new Date(currentYear, currentMonth + 1, 0)
  const dateFrom = formatDateOnly(monthStart)
  const dateTo = formatDateOnly(monthEnd)

  // The list API caps at 200 rows per request; a month beyond that is a
  // degenerate dataset, but at least surface it instead of silently hiding orders.
  const { data, isLoading, isError, error, refetch } = useOrders({
    execution_date_from: dateFrom,
    execution_date_to: dateTo,
    limit: 200,
  })

  const ordersByDay = useMemo(() => {
    const map: Record<string, Order[]> = {}
    if (data?.data) {
      for (const order of data.data) {
        // execution_date may carry a time part ("YYYY-MM-DD HH:MM"); calendar
        // cells are keyed by date only.
        const day = order.execution_date.slice(0, 10)
        if (!map[day]) map[day] = []
        map[day].push(order)
      }
    }
    return map
  }, [data])

  const daysInMonth = monthEnd.getDate()
  const startDayOfWeek = monthStart.getDay()

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const [pickerOpen, setPickerOpen] = useState(false)

  const monthNames = [
    t('January'),
    t('February'),
    t('March'),
    t('April'),
    t('May'),
    t('June'),
    t('July'),
    t('August'),
    t('September'),
    t('October'),
    t('November'),
    t('December'),
  ]

  const dayNames = [t('Sun'), t('Mon'), t('Tue'), t('Wed'), t('Thu'), t('Fri'), t('Sat')]

  const days = []
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="p-1 sm:p-2 min-h-[60px] sm:min-h-[100px]" />)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayOrders = ordersByDay[dateStr] ?? []
    const isToday = dateStr === formatDateOnly(today)

    days.push(
      // biome-ignore lint/a11y/useSemanticElements: contains nested buttons, cannot use <button>
      <div
        key={dateStr}
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/app/${currentOrgId}/orders/day/${dateStr}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ')
            navigate(`/app/${currentOrgId}/orders/day/${dateStr}`)
        }}
        className={`p-1 sm:p-2 border rounded min-h-[60px] sm:min-h-[100px] cursor-pointer hover:bg-gray-50 ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
      >
        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>{day}</div>
        <div className="space-y-1">
          {dayOrders.slice(0, 3).map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/app/${currentOrgId}/orders/${order.id}`)
              }}
              className="block w-full text-left text-xs p-1 rounded hover:bg-gray-100 truncate"
            >
              <OrderStatusBadge
                status={order.status as 'draft' | 'confirmed' | 'done' | 'cancelled'}
              />
              <span className="ml-1">{formatCurrency(order.total, currency)}</span>
            </button>
          ))}
          {dayOrders.length > 3 && (
            // biome-ignore lint/a11y/noStaticElementInteractions: stop propagation only
            // biome-ignore lint/a11y/useKeyWithClickEvents: not interactive, click stops bubble only
            <div className="text-xs text-gray-500" onClick={(e) => e.stopPropagation()}>
              +{dayOrders.length - 3} {t('more')}
            </div>
          )}
        </div>
      </div>,
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">{t('Order calendar')}</h1>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <span className="text-sm text-gray-500">{t('Loading...')}</span>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center max-w-md">
            <p className="text-red-700 font-medium">{t('Failed to load calendar data')}</p>
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
      )}

      {!isLoading && !isError && (
        <>
          {data?.next_cursor && (
            <p className="mb-4 text-sm text-amber-700">
              {t('This month has more than 200 orders. Only the first 200 are shown.')}
            </p>
          )}

          <div className="flex items-center justify-between mb-4 gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              {t('Previous month')}
            </Button>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="text-sm sm:text-lg font-semibold text-center hover:text-blue-600 hover:underline cursor-pointer"
            >
              {monthNames[currentMonth]} {currentYear}
            </button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              {t('Next month')}
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {dayNames.map((name) => (
              <div
                key={name}
                className="text-center text-xs sm:text-sm font-medium text-gray-500 p-1 sm:p-2"
              >
                {name}
              </div>
            ))}
            {days}
          </div>
        </>
      )}

      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          onClick={() => setPickerOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setPickerOpen(false)
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-5 w-80"
            role="document"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setCurrentYear(currentYear - 1)}
                className="text-lg px-2 hover:bg-gray-100 rounded"
              >
                &larr;
              </button>
              <span className="font-semibold text-lg">{currentYear}</span>
              <button
                type="button"
                onClick={() => setCurrentYear(currentYear + 1)}
                className="text-lg px-2 hover:bg-gray-100 rounded"
              >
                &rarr;
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {monthNames.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setCurrentMonth(i)
                    setPickerOpen(false)
                  }}
                  className={`py-2 rounded text-sm font-medium hover:bg-blue-50 ${i === currentMonth ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-50'}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
