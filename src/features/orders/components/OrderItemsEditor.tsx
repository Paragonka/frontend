import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '@/features/orgs/hooks/useCurrency'
import { formatCurrency } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import {
  useAddOrderItem,
  useCreateWriteOff,
  useRemoveOrderItem,
  useUpdateOrderItem,
} from '../hooks/useOrders'
import type { OrderItem, OrderItemCreate } from '../types'
import { AddOrderItemModal } from './AddOrderItemModal'
import { ProductInfoModal } from './ProductInfoModal'

interface OrderItemsEditorProps {
  orderId: string
  items: OrderItem[]
}

export function OrderItemsEditor({ orderId, items }: OrderItemsEditorProps) {
  const { t } = useTranslation()
  const currency = useCurrency()
  const addOrderItem = useAddOrderItem()
  const updateOrderItem = useUpdateOrderItem()
  const removeOrderItem = useRemoveOrderItem()
  const createWriteOff = useCreateWriteOff()
  const [writeOffQty, setWriteOffQty] = useState('')
  const [writeOffReason, setWriteOffReason] = useState('')
  const [writeOffItemId, setWriteOffItemId] = useState<string | null>(null)
  const [productInfoId, setProductInfoId] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editQty, setEditQty] = useState('')

  const startEdit = (item: OrderItem) => {
    setEditingItemId(item.id)
    setEditName(item.name)
    setEditPrice(String(item.price))
    setEditQty(String(item.qty))
  }

  const cancelEdit = () => {
    setEditingItemId(null)
  }

  const saveEdit = async (itemId: string) => {
    try {
      await updateOrderItem.mutateAsync({
        orderId,
        itemId,
        input: {
          name: editName,
          price: Number(editPrice) || 0,
          qty: Number(editQty) || 1,
        },
      })
      setEditingItemId(null)
    } catch {
      return
    }
  }

  const handleAddItem = async (input: OrderItemCreate) => {
    try {
      await addOrderItem.mutateAsync({ orderId, input })
    } catch {
      return
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeOrderItem.mutateAsync({ orderId, itemId })
    } catch {
      return
    }
  }

  const handleWriteOff = async (itemId: string) => {
    try {
      await createWriteOff.mutateAsync({
        orderId,
        input: {
          order_item_id: itemId,
          qty: Number(writeOffQty) || 0,
          reason: writeOffReason || undefined,
        },
      })
    } catch {
      return
    }
    setWriteOffQty('')
    setWriteOffReason('')
    setWriteOffItemId(null)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('Order items')}</h3>

      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">{t('No items')}</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 text-sm">{t('Name')}</th>
                <th className="text-right p-2 text-sm">{t('Price')}</th>
                <th className="text-right p-2 text-sm">{t('Qty')}</th>
                <th className="text-right p-2 text-sm">{t('Total')}</th>
                <th className="text-center p-2 text-sm">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  {editingItemId === item.id ? (
                    <>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border rounded px-2 py-1 w-full text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="border rounded px-2 py-1 w-24 text-sm text-right"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          className="border rounded px-2 py-1 w-20 text-sm text-center"
                        />
                      </td>
                      <td className="p-2 text-sm text-right">
                        {formatCurrency(
                          (Number(editPrice) || 0) * (Number(editQty) || 0),
                          currency,
                        )}
                      </td>
                      <td className="p-2 text-sm text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(item.id)}
                            disabled={updateOrderItem.isPending}
                          >
                            {t('Save')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            {t('Cancel')}
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2 text-sm">
                        {item.product_id ? (
                          <button
                            type="button"
                            onClick={() => item.product_id && setProductInfoId(item.product_id)}
                            className="text-blue-600 hover:underline text-left"
                          >
                            {item.name}
                          </button>
                        ) : (
                          item.name
                        )}
                      </td>
                      <td className="p-2 text-sm text-right">
                        {formatCurrency(item.price, currency)}
                      </td>
                      <td className="p-2 text-sm text-right">{item.qty}</td>
                      <td className="p-2 text-sm text-right">
                        {formatCurrency(item.price * item.qty, currency)}
                      </td>
                      <td className="p-2 text-sm text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            {t('Edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:underline text-xs"
                          >
                            {t('Delete')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWriteOffItemId(item.id)}
                            className="text-orange-600 hover:underline text-xs"
                          >
                            {t('Write off')}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {removeOrderItem.isError && (
        <p role="alert" className="text-red-500 text-sm">
          {removeOrderItem.error?.message}
        </p>
      )}

      {updateOrderItem.isError && (
        <p role="alert" className="text-red-500 text-sm">
          {updateOrderItem.error?.message}
        </p>
      )}

      {writeOffItemId && (
        <div className="border rounded p-3 bg-orange-50 space-y-2">
          <h4 className="text-sm font-semibold">{t('Material write-off')}</h4>
          <div className="flex flex-col sm:flex-row gap-2 items-end">
            <div>
              <label htmlFor="writeoff-qty" className="block text-xs font-medium mb-1">
                {t('Qty')}
              </label>
              <input
                id="writeoff-qty"
                type="number"
                min="0"
                step="1"
                value={writeOffQty}
                onChange={(e) => setWriteOffQty(e.target.value)}
                className="border rounded px-2 py-1 w-20 text-sm"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="writeoff-reason" className="block text-xs font-medium mb-1">
                {t('Notes')}
              </label>
              <input
                id="writeoff-reason"
                type="text"
                value={writeOffReason}
                onChange={(e) => setWriteOffReason(e.target.value)}
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder={t('Reason')}
              />
            </div>
            <Button
              size="sm"
              onClick={() => handleWriteOff(writeOffItemId)}
              disabled={createWriteOff.isPending || !writeOffQty}
            >
              {t('Write off')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setWriteOffItemId(null)}>
              {t('Cancel')}
            </Button>
          </div>
        </div>
      )}

      {createWriteOff.isError && (
        <p role="alert" className="text-red-500 text-xs">
          {createWriteOff.error?.message}
        </p>
      )}

      <Button variant="outline" onClick={() => setAddModalOpen(true)}>
        {t('Add product')}
      </Button>

      {addOrderItem.isError && (
        <p role="alert" className="text-red-500 text-xs">
          {addOrderItem.error?.message}
        </p>
      )}

      <ProductInfoModal
        productId={productInfoId}
        open={!!productInfoId}
        onOpenChange={(open) => {
          if (!open) setProductInfoId(null)
        }}
      />

      <AddOrderItemModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAdd={handleAddItem}
        isLoading={addOrderItem.isPending}
      />
    </div>
  )
}
