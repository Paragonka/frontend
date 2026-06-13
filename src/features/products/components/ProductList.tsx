import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '@/features/orgs/hooks/useCurrency'
import { ApiError } from '@/shared/api/errors'
import { PRODUCT_TYPES } from '@/shared/constants'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { usePagination } from '@/shared/hooks/usePagination'
import { formatCurrency } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Pagination } from '@/shared/ui/pagination'
import { useDeleteProduct, useProducts } from '../hooks/useProducts'
import { ProductCreateDialog } from './ProductCreateDialog'
import { ProductEditDialog } from './ProductEditDialog'

const SORT_OPTIONS = [
  { value: '', label: 'Name', arrow: ' ↑' },
  { value: '-name', label: 'Name', arrow: ' ↓' },
  { value: 'price', label: 'Price', arrow: ' ↑' },
  { value: '-price', label: 'Price', arrow: ' ↓' },
  { value: '-created_at', label: 'Newest' },
  { value: 'created_at', label: 'Oldest' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'All' },
  ...PRODUCT_TYPES.map((type) => ({ value: type, label: type })),
]

function getDeleteErrorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiError) {
    if (error.code === 'PRODUCT_IN_USE') {
      return t('Cannot delete product: it is a component of another product')
    }
    return error.message
  }
  if (error instanceof Error) return error.message
  return t('An unexpected error occurred')
}

export function ProductList() {
  const { t } = useTranslation()
  const currency = useCurrency()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('')
  const [productType, setProductType] = useState('')
  const [editProductId, setEditProductId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const deleteProduct = useDeleteProduct()
  const debouncedSearch = useDebounce(search)
  const { page, currentCursor, limit, visitedPages, nextPage, prevPage, goToPage, reset } =
    usePagination()

  const typeLabels: Record<string, string> = useMemo(
    () => ({
      good: t('Good'),
      service: t('Service'),
      material: t('Material'),
    }),
    [t],
  )

  const { data, isLoading, isError, error, refetch } = useProducts({
    name: debouncedSearch || undefined,
    product_type: productType || undefined,
    cursor: currentCursor || undefined,
    sort: sort || undefined,
    limit,
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
          <p className="text-red-700 font-medium">{t('Failed to load products')}</p>
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
        <h1 className="text-xl sm:text-2xl font-bold">{t('Products')}</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreate(true)}>{t('New Product')}</Button>
        </div>
      </div>

      <input
        type="text"
        placeholder={t('Search by name...')}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          reset(true)
        }}
        className="w-full border rounded px-3 py-2 mb-4"
      />

      {deleteProduct.error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
        >
          {getDeleteErrorMessage(deleteProduct.error, t)}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mb-3">
        <select
          value={productType}
          onChange={(e) => {
            setProductType(e.target.value)
            reset(true)
          }}
          className="border rounded px-2 py-1 text-sm"
          aria-label={t('Product type')}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value ? typeLabels[opt.value] : t(opt.label)}
            </option>
          ))}
        </select>
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

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[420px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">{t('Name')}</th>
              <th className="text-left p-3">{t('Category')}</th>
              <th className="text-left p-3">{t('Price')}</th>
              <th className="text-left p-3">{t('Stock')}</th>
              <th className="text-left p-3">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((product) => (
              <tr key={product.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <span title={product.name} className="block max-w-[240px] truncate">
                    {product.name}
                  </span>
                </td>
                <td className="p-3">{product.category}</td>
                <td className="p-3">{formatCurrency(product.price, currency)}</td>
                <td className="p-3">
                  {product.track_inventory ? (
                    product.stock_qty != null ? (
                      <span
                        data-testid={`stock-${product.id}`}
                        className={
                          product.stock_qty === 0
                            ? 'bg-red-100 text-red-700 rounded px-2 py-0.5 text-xs'
                            : 'bg-gray-100 rounded px-2 py-0.5 text-xs'
                        }
                      >
                        {product.stock_qty}
                      </span>
                    ) : (
                      <span data-testid={`stock-${product.id}`} className="text-gray-400 text-xs">
                        —
                      </span>
                    )
                  ) : (
                    <span
                      data-testid={`stock-${product.id}`}
                      title={t('Inventory not tracked')}
                      className="text-gray-500 text-xs"
                    >
                      ∞
                    </span>
                  )}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setEditProductId(product.id)}
                    className="text-blue-600 hover:underline mr-3"
                  >
                    {t('Edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('Delete product?'))) {
                        deleteProduct.mutate(product.id)
                      }
                    }}
                    className="text-red-600 hover:underline"
                  >
                    {t('Delete')}
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

      <ProductCreateDialog open={showCreate} onOpenChange={(open) => setShowCreate(open)} />
      <ProductEditDialog
        productId={editProductId ?? ''}
        open={!!editProductId}
        onOpenChange={(open) => {
          if (!open) setEditProductId(null)
        }}
      />
    </div>
  )
}
