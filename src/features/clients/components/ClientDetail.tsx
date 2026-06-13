import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge'
import { useCurrency } from '@/features/orgs/hooks/useCurrency'
import { formatCurrency, formatDate } from '@/shared/lib/format'
import { useAuthStore } from '@/shared/store/auth'
import { Button } from '@/shared/ui/button'
import { useClient, useClientOrders } from '../hooks/useClients'
import { ClientEditDialog } from './ClientEditDialog'

export function ClientDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentOrgId = useAuthStore((s) => s.currentOrgId)
  const currency = useCurrency()
  const { data: client, isLoading: clientLoading } = useClient(id || '')
  const { data: clientOrders = [], isLoading: ordersLoading } = useClientOrders(id || '')
  const [editOpen, setEditOpen] = useState(false)

  if (clientLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    )
  if (!client) return <div>{t('No data')}</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {client.name} {client.surname}
          </h1>
          {client.phone && <p className="text-sm text-gray-500">{client.phone}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/app/${currentOrgId}/clients`)}>
            {t('Back')}
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            {t('Edit')}
          </Button>
        </div>
      </div>

      {client.notes && (
        <div className="bg-white rounded-lg border p-4">
          <span className="text-sm text-gray-500">{t('Notes')}:</span>
          <span className="ml-2">{client.notes}</span>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">
          {t('Orders')} ({clientOrders.length})
        </h2>
        {ordersLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          </div>
        ) : clientOrders.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
            {t('No orders for this client')}
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">{t('Status')}</th>
                  <th className="text-left p-3">{t('Total')}</th>
                  <th className="text-left p-3">{t('Execution date')}</th>
                  <th className="text-left p-3">{t('Items')}</th>
                  <th className="text-left p-3">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {clientOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/app/${currentOrgId}/orders/${order.id}`)}
                  >
                    <td className="p-3">
                      <OrderStatusBadge
                        status={order.status as 'draft' | 'confirmed' | 'done' | 'cancelled'}
                      />
                    </td>
                    <td className="p-3">{formatCurrency(order.total, currency)}</td>
                    <td className="p-3">{formatDate(order.execution_date)}</td>
                    <td className="p-3 text-sm text-gray-600 max-w-[200px] truncate">
                      {order.items && order.items.length > 0
                        ? order.items.map((i) => `${i.name} ×${i.qty}`).join(', ')
                        : '—'}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/app/${currentOrgId}/orders/${order.id}`)
                        }}
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

      <ClientEditDialog clientId={client.id} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  )
}
