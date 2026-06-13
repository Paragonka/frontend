import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useEavAttributes } from '@/features/eav/hooks/useEavAttributes'
import { PhotoGallery } from '@/features/media/components/PhotoGallery'
import { PhotoUpload } from '@/features/media/components/PhotoUpload'
import { useDeleteMedia, useEntityPhotos } from '@/features/media/hooks/useMedia'
import { useCurrency } from '@/features/orgs/hooks/useCurrency'
import { formatCurrency, formatDate } from '@/shared/lib/format'
import { useAuthStore } from '@/shared/store/auth'
import { Button } from '@/shared/ui/button'
import { useChangeOrderStatus, useOrder } from '../hooks/useOrders'
import { OrderItemsEditor } from './OrderItemsEditor'
import { OrderStatusBadge } from './OrderStatusBadge'

export function OrderDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentOrgId = useAuthStore((s) => s.currentOrgId)
  const currency = useCurrency()
  const { data: order, isLoading } = useOrder(id || '')
  const changeOrderStatus = useChangeOrderStatus()
  const { data: photos = [] } = useEntityPhotos('orders', id || '')
  const { data: eavAttributes } = useEavAttributes('order')
  const deleteMedia = useDeleteMedia()

  if (isLoading) return <div>{t('Loading...')}</div>
  if (!order) return <div>{t('No data')}</div>

  const canConfirm = order.status === 'draft'
  const canDone = order.status === 'confirmed'

  const handleStatusChange = async (newStatus: string) => {
    try {
      await changeOrderStatus.mutateAsync({ orderId: order.id, status: newStatus })
    } catch {
      return
    }
  }

  const handleDeletePhoto = (key: string) => {
    if (window.confirm(t('Are you sure you want to delete this photo?'))) {
      deleteMedia.mutate(key)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {t('Order')} #{order.id.slice(0, 8)}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {t('Order')} ID: {order.id}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            {t('Back')}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{t('Status')}:</span>
          <OrderStatusBadge status={order.status as 'draft' | 'confirmed' | 'done' | 'cancelled'} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">{t('Client')}:</span>
            {order.client_id ? (
              <button
                type="button"
                onClick={() => navigate(`/app/${currentOrgId}/clients/${order.client_id}`)}
                className="ml-2 font-medium text-blue-600 hover:underline"
              >
                {order.client_name || '—'}
              </button>
            ) : (
              <span className="ml-2 font-medium">—</span>
            )}
          </div>
          <div>
            <span className="text-gray-500">{t('Execution date')}:</span>
            <span className="ml-2 font-medium">{formatDate(order.execution_date)}</span>
          </div>
          <div>
            <span className="text-gray-500">{t('Total')}:</span>
            <span className="ml-2 font-medium">{formatCurrency(order.total, currency)}</span>
          </div>
          {order.notes && (
            <div className="col-span-2">
              <span className="text-gray-500">{t('Notes')}:</span>
              <span className="ml-2">{order.notes}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          {canConfirm && (
            <Button
              size="sm"
              onClick={() => handleStatusChange('confirmed')}
              disabled={changeOrderStatus.isPending}
            >
              {t('Confirm')}
            </Button>
          )}
          {canDone && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleStatusChange('done')}
              disabled={changeOrderStatus.isPending}
            >
              {t('Complete')}
            </Button>
          )}
          {order.status !== 'cancelled' && order.status !== 'done' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleStatusChange('cancelled')}
              disabled={changeOrderStatus.isPending}
            >
              {t('Cancel order')}
            </Button>
          )}
        </div>

        {changeOrderStatus.isError && (
          <p role="alert" className="text-red-500 text-sm">
            {changeOrderStatus.error?.message}
          </p>
        )}
      </div>

      {order.custom_fields && Object.keys(order.custom_fields).length > 0 && (
        <div className="bg-white rounded-lg border p-4 space-y-2">
          <h2 className="text-lg font-semibold">{t('Custom fields')}</h2>
          {Object.entries(order.custom_fields).map(([code, value]) => {
            const attr = eavAttributes?.find((a) => a.code === code)
            const label = attr?.name ?? code
            const display =
              typeof value === 'boolean'
                ? value
                  ? t('Yes')
                  : t('No')
                : value == null || value === ''
                  ? '—'
                  : String(value)
            return (
              <div key={code} className="text-sm">
                <span className="text-gray-500">{label}:</span>
                <span className="ml-2 font-medium">{display}</span>
              </div>
            )
          })}
        </div>
      )}

      <OrderItemsEditor orderId={order.id} items={order.items ?? []} />

      <div className="bg-white rounded-lg border p-4 space-y-4">
        <PhotoGallery photos={photos} onDelete={handleDeletePhoto} />
        <div className="border-t pt-4">
          <PhotoUpload entityType="orders" entityId={order.id} />
        </div>
      </div>
    </div>
  )
}
