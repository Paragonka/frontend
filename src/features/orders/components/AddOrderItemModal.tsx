import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '@/features/orgs/hooks/useCurrency'
import { useProducts } from '@/features/products/hooks/useProducts'
import { formatCurrency } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import type { OrderItemCreate } from '../types'

interface AddOrderItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (input: OrderItemCreate) => void
  isLoading?: boolean
}

export function AddOrderItemModal({
  open,
  onOpenChange,
  onAdd,
  isLoading,
}: AddOrderItemModalProps) {
  const { t } = useTranslation()
  const currency = useCurrency()
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [qty, setQty] = useState('1')
  const [priceOverride, setPriceOverride] = useState('')

  const { data } = useProducts({
    name: search || undefined,
    sort: '',
    limit: 50,
  })

  const products = data?.data ?? []
  const selected = products.find((p) => p.id === selectedProduct)

  const handleAdd = () => {
    if (!selected) return
    onAdd({
      product_id: selected.id,
      name: selected.name,
      price: priceOverride ? Number(priceOverride) : selected.price,
      qty: Number(qty) || 1,
    })
    setSelectedProduct(null)
    setQty('1')
    setPriceOverride('')
    setSearch('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('Add product')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <input
            type="text"
            placeholder={t('Search products...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            autoFocus
          />

          <div className="max-h-[300px] overflow-y-auto border rounded">
            {products.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">{t('No products found')}</div>
            ) : (
              products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    setSelectedProduct(product.id)
                    setPriceOverride(String(product.price))
                  }}
                  className={`w-full text-left px-3 py-2 border-b last:border-0 hover:bg-gray-50 text-sm ${
                    selectedProduct === product.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-gray-500">
                    {product.category} · {formatCurrency(product.price, currency)}
                  </div>
                </button>
              ))
            )}
          </div>

          {selected && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="font-medium">{selected.name}</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modal-price" className="block text-xs font-medium mb-1">
                    {t('Price')}
                  </label>
                  <input
                    id="modal-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceOverride}
                    onChange={(e) => setPriceOverride(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="modal-qty" className="block text-xs font-medium mb-1">
                    {t('Qty')}
                  </label>
                  <input
                    id="modal-qty"
                    type="number"
                    min="1"
                    step="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {t('Total')}:{' '}
                <span className="font-medium">
                  {formatCurrency(
                    (priceOverride ? Number(priceOverride) : selected.price) * (Number(qty) || 1),
                    currency,
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button onClick={handleAdd} disabled={!selected || isLoading}>
              {t('Add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
