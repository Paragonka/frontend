import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useCurrency } from '@/features/orgs/hooks/useCurrency'
import { formatCurrency, formatDate } from '@/shared/lib/format'
import { useAuthStore } from '@/shared/store/auth'
import { Button } from '@/shared/ui/button'
import { useOrders } from '../hooks/useOrders'
import { OrderStatusBadge } from './OrderStatusBadge'

export function OrderDayView() {
  const { t } = useTranslation()
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const currentOrgId = useAuthStore((s) => s.currentOrgId)
  const currency = useCurrency()

  const { data, isLoading, isError, error, refetch } = useOrders({
    execution_date_from: date,
    execution_date_to: date,
    limit: 200,
  })

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            {t('Retry')}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/app/${currentOrgId}/orders/calendar`)}
          >
            {t('Back to calendar')}
          </Button>
        </div>
      </div>
    )
  }

  const orders = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{formatDate(date ?? '')}</h1>
          <p className="text-sm text-gray-500">
            {orders.length} {orders.length === 1 ? t('order') : t('orders')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/app/${currentOrgId}/orders/calendar`)}
          >
            {t('Back to calendar')}
          </Button>
          <Button onClick={() => navigate(`/app/${currentOrgId}/orders/new?date=${date}`)}>
            {t('New Order')}
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          {t('No orders for this day')}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">{t('Order')}</th>
                <th className="text-left p-3">{t('Status')}</th>
                <th className="text-left p-3">{t('Total')}</th>
                <th className="text-left p-3">{t('Notes')}</th>
                <th className="text-left p-3">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm">{order.id.slice(0, 8)}</td>
                  <td className="p-3">
                    <OrderStatusBadge
                      status={order.status as 'draft' | 'confirmed' | 'done' | 'cancelled'}
                    />
                  </td>
                  <td className="p-3">{formatCurrency(order.total, currency)}</td>
                  <td className="p-3 text-sm text-gray-500 truncate max-w-[200px]">
                    {order.notes || '—'}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/app/${currentOrgId}/orders/${order.id}`)}
                      className="text-blue-600 hover:underline"
                    >
                      {t('Details')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
