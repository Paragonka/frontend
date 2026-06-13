import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useCurrency } from '@/features/orgs/hooks/useCurrency'
import { formatCurrency, formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { useDeleteReceipt, useReceipt, useReceiptItems } from '../hooks/useReceipts'

export function ReceiptDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const currency = useCurrency()

  const { data: receipt, isLoading } = useReceipt(id || '')
  const { data: items } = useReceiptItems(id || '')
  const deleteReceipt = useDeleteReceipt()

  if (isLoading) return <div>{t('Loading...')}</div>
  if (!receipt) return <div>{t('Not found')}</div>

  const handleDelete = async () => {
    await deleteReceipt.mutateAsync(id || '')
    navigate('..', { relative: 'path' })
  }

  const total = items?.reduce((sum, item) => sum + item.price * item.qty, 0) ?? receipt.total

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold font-mono break-all">{receipt.id}</h1>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => navigate('..', { relative: 'path' })}>
            {t('Back')}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteReceipt.isPending}>
            {deleteReceipt.isPending ? t('Deleting...') : t('Delete')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-white rounded-lg border p-4">
        <div>
          <span className="text-sm text-gray-500">{t('Date')}</span>
          <p className="font-medium">{formatDate(receipt.receipt_date)}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">{t('Total')}</span>
          <p className="font-medium">{formatCurrency(total, currency)}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">{t('Source')}</span>
          <p className="font-medium">{receipt.source || '-'}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">{t('Notes')}</span>
          <p className="font-medium">{receipt.notes || '-'}</p>
        </div>
      </div>

      {items && items.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{t('Receipt items')}</h2>
          <div className="bg-white rounded-lg border overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 whitespace-nowrap">{t('Name')}</th>
                  <th className="text-left p-3 whitespace-nowrap">{t('Price')}</th>
                  <th className="text-left p-3 whitespace-nowrap">{t('Qty')}</th>
                  <th className="text-left p-3 whitespace-nowrap">{t('Total')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3 whitespace-nowrap">{item.name}</td>
                    <td className="p-3 whitespace-nowrap">
                      {formatCurrency(item.price, currency)}
                    </td>
                    <td className="p-3 whitespace-nowrap">{item.qty}</td>
                    <td className="p-3 whitespace-nowrap">
                      {formatCurrency(item.price * item.qty, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {receipt.raw_data && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{t('Raw data')}</h2>
          <pre className="bg-gray-100 rounded-lg p-4 text-sm overflow-auto max-h-96">
            {JSON.stringify(receipt.raw_data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
