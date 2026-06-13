import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCurrency } from '@/features/orgs/hooks/useCurrency'
import { useAllProducts } from '@/features/products/hooks/useProducts'
import { formatCurrency, formatDateOnly } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { useCreateReceipt } from '../hooks/useReceipts'
import type { ManualReceiptItemCreate, ReceiptItemCreate } from '../types'
import { JpkUploadZone } from './JpkUploadZone'

type RowErrors = Record<number, { name?: boolean; price?: boolean; qty?: boolean }>

const getRowErrors = (item: ReceiptItemCreate) => {
  const errors: RowErrors[number] = {}
  if (!item.name.trim()) errors.name = true
  const price = Number(item.price)
  if (!Number.isFinite(price) || price <= 0) errors.price = true
  const qty = Number(item.qty)
  if (!Number.isFinite(qty) || qty <= 0) errors.qty = true
  return Object.keys(errors).length > 0 ? errors : null
}

export function ReceiptForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createReceipt = useCreateReceipt()
  const { data: products = [] } = useAllProducts()
  const currency = useCurrency()

  const [mode, setMode] = useState<'manual' | 'jpk'>('jpk')
  const [receiptDate, setReceiptDate] = useState(() => formatDateOnly(new Date()))
  const [source, setSource] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ReceiptItemCreate[]>([])
  const [total, setTotal] = useState(0)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [storeName, setStoreName] = useState('')
  const [tin, setTin] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<RowErrors>({})

  const isJpkMode = mode === 'jpk'
  const hasItems = items.length > 0
  const hasDiscounts = items.some((i) => i.discount && i.discount > 0)
  const hasVat = items.some((i) => i.vat_rate)
  const showReceiptInfo = isJpkMode && (storeName || tin || docNumber || receiptDate)
  const grandTotal = useMemo(
    () =>
      isJpkMode && total > 0
        ? total
        : items.reduce((sum, i) => sum + (i.price ?? 0) * (i.qty ?? 0), 0),
    [items, total, isJpkMode],
  )

  const handleJpkParsed = (data: {
    items: ReceiptItemCreate[]
    source: string
    receiptDate: string
    notes: string
    total: number
    storeName?: string
    tin?: string
    docNumber?: string
  }) => {
    setItems(data.items)
    setSource(data.source)
    setReceiptDate(data.receiptDate)
    setNotes(data.notes)
    setTotal(data.total)
    setStoreName(data.storeName || '')
    setTin(data.tin || '')
    setDocNumber(data.docNumber || '')
  }

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId)
    if (!productId) return
    const product = products.find((p) => p.id === productId)
    if (product) {
      setItems([
        ...items,
        { product_id: product.id, name: product.name, price: Number(product.price), qty: 1 },
      ])
      setSelectedProductId('')
    }
  }

  const updateItem = (index: number, field: keyof ReceiptItemCreate, value: string | number) => {
    const nextItems = items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    setItems(nextItems)
    setRowErrors((prev) => {
      const item = nextItems[index]
      if (!item) return prev
      const row = getRowErrors(item)
      const next = { ...prev }
      if (row) next[index] = row
      else delete next[index]
      return next
    })
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const filteredItems = items.filter((i) => i.name.trim())
    if (filteredItems.length === 0) return

    if (!isJpkMode) {
      const nextErrors: RowErrors = {}
      items.forEach((item, index) => {
        const row = getRowErrors(item)
        if (row) nextErrors[index] = row
      })
      if (Object.keys(nextErrors).length > 0) {
        setSubmitError(null)
        setRowErrors(nextErrors)
        return
      }
    }

    setSubmitError(null)
    try {
      const payloadItems: ManualReceiptItemCreate[] | ReceiptItemCreate[] = isJpkMode
        ? filteredItems
        : filteredItems.map(({ name, price, qty, product_id }) => ({
            name,
            price: Number(price),
            qty: Number(qty),
            product_id: product_id ?? null,
          }))
      await createReceipt.mutateAsync({
        receipt_date: receiptDate,
        source: source || null,
        notes: notes || null,
        items: payloadItems,
      })
      navigate('..', { relative: 'path' })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('An unexpected error occurred'))
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-0">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{t('Create receipt')}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <p role="alert" className="text-sm text-red-600">
            {submitError}
          </p>
        )}

        <div className="flex gap-2 sm:gap-4 mb-4 flex-wrap">
          <button
            type="button"
            onClick={() => setMode('jpk')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              isJpkMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('Upload JPK')}
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              !isJpkMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('Manual')}
          </button>
        </div>

        {isJpkMode && <JpkUploadZone onParsed={handleJpkParsed} />}

        {showReceiptInfo && (
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">{t('Receipt info')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {storeName && (
                <div>
                  <span className="text-gray-500">{t('Store')}:</span>{' '}
                  <span className="font-medium">{storeName}</span>
                </div>
              )}
              {tin && (
                <div>
                  <span className="text-gray-500">NIP:</span>{' '}
                  <span className="font-medium">{tin}</span>
                </div>
              )}
              {receiptDate && (
                <div>
                  <span className="text-gray-500">{t('Date')}:</span>{' '}
                  <span className="font-medium">{receiptDate}</span>
                </div>
              )}
              {docNumber && (
                <div>
                  <span className="text-gray-500">{t('Receipt no')}:</span>{' '}
                  <span className="font-medium">{docNumber}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white rounded-lg border p-4">
          <div>
            <label htmlFor="receipt-date" className="block text-sm font-medium mb-1">
              {t('Date')}
            </label>
            {isJpkMode && hasItems ? (
              <span className="block px-3 py-2 w-full bg-gray-50 border rounded text-sm">
                {receiptDate}
              </span>
            ) : (
              <input
                id="receipt-date"
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="border rounded px-3 py-2 w-full bg-white"
                required
              />
            )}
          </div>
          <div>
            <label htmlFor="receipt-source" className="block text-sm font-medium mb-1">
              {t('Source')}
            </label>
            {isJpkMode && hasItems ? (
              <span className="block px-3 py-2 w-full bg-gray-50 border rounded text-sm">
                {source || '- - -'}
              </span>
            ) : (
              <input
                id="receipt-source"
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="border rounded px-3 py-2 w-full bg-white"
              />
            )}
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label htmlFor="receipt-notes" className="block text-sm font-medium mb-1">
              {t('Notes')}
            </label>
            <textarea
              id="receipt-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border rounded px-3 py-2 w-full bg-white"
              rows={2}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
            <span className="font-semibold text-sm">{t('Items')}</span>
            {!isJpkMode && (
              <span className="text-xs text-gray-500">
                {items.length} {items.length === 1 ? t('item') : t('Items')}
              </span>
            )}
          </div>

          {!isJpkMode && (
            <div className="p-3 border-b bg-gray-50">
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="border rounded px-3 py-2 w-full bg-white"
              >
                <option value="">{t('Select product')}...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {Number(p.price).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!hasItems ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              {isJpkMode ? t('Upload JPK receipt') : t('Add items to the order first')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600 whitespace-nowrap">
                      {t('Name')}
                    </th>
                    <th className="text-right p-3 font-medium text-gray-600 whitespace-nowrap">
                      {t('Price')}
                    </th>
                    {isJpkMode && hasVat && (
                      <th className="text-right p-3 font-medium text-gray-600 whitespace-nowrap">
                        {t('VAT')}
                      </th>
                    )}
                    <th className="text-right p-3 font-medium text-gray-600 whitespace-nowrap">
                      {t('Qty')}
                    </th>
                    {isJpkMode && hasDiscounts && (
                      <th className="text-right p-3 font-medium text-gray-600 whitespace-nowrap">
                        {t('Discount')}
                      </th>
                    )}
                    <th className="text-right p-3 font-medium text-gray-600 whitespace-nowrap">
                      {t('Total')}
                    </th>
                    {!isJpkMode && <th className="w-10" />}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: items have no stable id
                    <tr key={index} className="border-t hover:bg-gray-50">
                      {isJpkMode ? (
                        <>
                          <td className="p-2 whitespace-nowrap">{item.name}</td>
                          <td className="p-2 text-right whitespace-nowrap">
                            {formatCurrency(item.price ?? 0, currency)}
                          </td>
                          {hasVat && (
                            <td className="p-2 text-right whitespace-nowrap text-gray-500">
                              {item.vat_rate ? `${item.vat_percent ?? ''}%` : '-'}
                            </td>
                          )}
                          <td className="p-2 text-right whitespace-nowrap">{item.qty ?? 1}</td>
                          {hasDiscounts && (
                            <td className="p-2 text-right text-red-600 whitespace-nowrap">
                              {item.discount ? (
                                <span>-{formatCurrency(item.discount, currency)}</span>
                              ) : (
                                '-'
                              )}
                            </td>
                          )}
                          <td className="p-2 text-right font-medium whitespace-nowrap">
                            <span>
                              {formatCurrency((item.price ?? 0) * (item.qty ?? 0), currency)}
                            </span>
                            {item.original_total && (
                              <span className="text-gray-400 font-normal text-xs ml-1">
                                ({formatCurrency(item.original_total, currency)})
                              </span>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(index, 'name', e.target.value)}
                              className="border rounded px-2 py-1.5 w-full bg-white text-sm"
                            />
                            {rowErrors[index]?.name && (
                              <p className="text-red-600 text-xs mt-1">{t('Name is required')}</p>
                            )}
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateItem(index, 'price', Number(e.target.value))}
                              className="border rounded px-2 py-1.5 w-24 bg-white text-sm text-right"
                              step="0.01"
                              min="0"
                            />
                            {rowErrors[index]?.price && (
                              <p className="text-red-600 text-xs mt-1">
                                {t('Price must be greater than 0')}
                              </p>
                            )}
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateItem(index, 'qty', Number(e.target.value))}
                              className="border rounded px-2 py-1.5 w-20 bg-white text-sm text-right"
                              min="0"
                              step="0.01"
                            />
                            {rowErrors[index]?.qty && (
                              <p className="text-red-600 text-xs mt-1">
                                {t('Quantity must be greater than 0')}
                              </p>
                            )}
                          </td>
                          <td className="p-2 text-right font-medium whitespace-nowrap">
                            {formatCurrency((item.price ?? 0) * (item.qty ?? 0), currency)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-500 hover:text-red-700 text-lg leading-none"
                            >
                              ×
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t bg-gray-50 px-3 py-2.5 flex justify-between font-semibold text-sm">
                <span>{t('Total')}</span>
                <span>{formatCurrency(grandTotal, currency)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={createReceipt.isPending || !hasItems}>
            {createReceipt.isPending ? t('Saving...') : t('Save')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('..', { relative: 'path' })}
          >
            {t('Cancel')}
          </Button>
        </div>
      </form>
    </div>
  )
}
