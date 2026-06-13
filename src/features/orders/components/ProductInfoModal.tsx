import { useTranslation } from 'react-i18next'
import { useCurrency } from '@/features/orgs/hooks/useCurrency'
import { useProduct } from '@/features/products/hooks/useProducts'
import { formatCurrency } from '@/shared/lib/format'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

interface ProductInfoModalProps {
  productId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductInfoModal({ productId, open, onOpenChange }: ProductInfoModalProps) {
  const { t } = useTranslation()
  const currency = useCurrency()
  const { data: product, isLoading } = useProduct(open ? productId || '' : '')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('Product')}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">{t('Loading...')}</div>
        ) : product ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('Name')}:</span>
              <span className="font-medium">{product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('Category')}:</span>
              <span>{product.category || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('Price')}:</span>
              <span>{formatCurrency(product.price, currency)}</span>
            </div>
            {product.cost_price > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">{t('Cost price')}:</span>
                <span>{formatCurrency(product.cost_price, currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">{t('Unit')}:</span>
              <span>{product.unit || '—'}</span>
            </div>
            {product.stock_qty !== null && (
              <div className="flex justify-between">
                <span className="text-gray-500">{t('Stock')}:</span>
                <span>
                  {product.stock_qty} {product.unit || ''}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">{t('Type')}:</span>
              <span>{t(product.product_type)}</span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">{t('Product not found')}</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
