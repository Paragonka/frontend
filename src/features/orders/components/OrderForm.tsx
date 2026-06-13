import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAllClients } from '@/features/clients/hooks/useClients'
import { EavFieldsForm, type EavFieldsFormHandle } from '@/features/eav/components/EavFieldsForm'
import { useAllProducts } from '@/features/products/hooks/useProducts'
import {
  LocalFieldsEditor,
  type LocalFieldsValue,
  normalizeLocalFields,
} from '@/shared/components/LocalFieldsEditor'
import { formatDateOnly } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { useCreateOrder } from '../hooks/useOrders'
import type { OrderItemCreate } from '../types'

const orderSchema = z.object({
  client_id: z.string().optional(),
  execution_date: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().min(1, 'Product is required'),
        name: z.string().optional(),
        price: z.number().min(0).optional(),
        qty: z.number().min(0.01, 'Qty must be > 0').optional(),
      }),
    )
    .optional(),
})

type OrderFormInput = z.input<typeof orderSchema>
type OrderFormData = z.output<typeof orderSchema>

export function OrderForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createOrder = useCreateOrder()
  const { data: clientsData = [] } = useAllClients()
  const { data: allProducts = [] } = useAllProducts()
  const [localFields, setLocalFields] = useState<LocalFieldsValue>({})
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const eavFieldsRef = useRef<EavFieldsFormHandle>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<OrderFormInput, unknown, OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      client_id: '',
      execution_date: formatDateOnly(new Date()),
      notes: '',
      items: [],
    },
  })

  const {
    fields: itemFields,
    append: addItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedItems = watch('items')

  const handleProductSelect = (index: number, productId: string) => {
    const product = allProducts.find((p) => p.id === productId)
    if (product) {
      setValue(`items.${index}.product_id`, productId, { shouldValidate: true })
      setValue(`items.${index}.name`, product.name)
      setValue(`items.${index}.price`, Number(product.price))
      setValue(`items.${index}.qty`, 1)
    }
  }

  const handleAddItem = () => {
    addItem({ product_id: '', name: '', price: 0, qty: 1 })
  }

  const onSubmit = async (data: OrderFormData) => {
    setSubmitError(null)
    if (!eavFieldsRef.current?.validate()) return
    const items: OrderItemCreate[] = (data.items ?? [])
      .filter((item) => item.product_id)
      .map((item) => ({
        product_id: item.product_id,
        name: item.name || '',
        price: item.price ?? 0,
        qty: item.qty ?? 1,
      }))
    try {
      const order = await createOrder.mutateAsync({
        client_id: data.client_id || null,
        execution_date: data.execution_date || undefined,
        notes: data.notes || undefined,
        custom_fields: customFields,
        local_fields: normalizeLocalFields(localFields),
        items,
      })
      navigate(`../orders/${order.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setSubmitError(message)
    }
  }

  const availableProducts = allProducts.filter((p) => p.is_active)

  const itemsTotal = (watchedItems ?? []).reduce((sum, item) => {
    const price = item?.price ?? 0
    const qty = item?.qty ?? 0
    return sum + price * qty
  }, 0)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{t('New Order')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {submitError}
          </div>
        )}
        <div>
          <label htmlFor="client_id" className="block text-sm font-medium mb-1">
            {t('Client')}
          </label>
          <select
            id="client_id"
            {...register('client_id')}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">{t('Without client')}</option>
            {clientsData.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} {client.surname}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="execution_date" className="block text-sm font-medium mb-1">
            {t('Execution date')}
          </label>
          <input
            id="execution_date"
            type="date"
            {...register('execution_date')}
            className="w-full border rounded px-3 py-2"
          />
          {errors.execution_date && (
            <p className="text-red-500 text-xs">{errors.execution_date.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            {t('Notes')}
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-2">{t('Order items')}</h3>
          <p className="text-sm text-gray-500 mb-2">{t('Add products to the order')}</p>

          {itemFields.length > 0 && (
            <div className="bg-white rounded-lg border overflow-x-auto mb-2">
              <table className="w-full min-w-[560px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2 text-sm w-2/5">{t('Product')}</th>
                    <th className="text-left p-2 text-sm w-1/5">{t('Name')}</th>
                    <th className="text-right p-2 text-sm w-1/6">{t('Price')}</th>
                    <th className="text-right p-2 text-sm w-1/6">{t('Qty')}</th>
                    <th className="text-center p-2 text-sm w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {itemFields.map((field, index) => (
                    <tr key={field.id} className="border-t">
                      <td className="p-1">
                        <select
                          {...register(`items.${index}.product_id`)}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm"
                        >
                          <option value="">{t('Select product')}</option>
                          {availableProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.price})
                            </option>
                          ))}
                        </select>
                        {errors.items?.[index]?.product_id && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.items[index]?.product_id?.message}
                          </p>
                        )}
                      </td>
                      <td className="p-1">
                        <input
                          {...register(`items.${index}.name`)}
                          className="w-full border rounded px-2 py-1 text-sm"
                          placeholder={t('Name')}
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`items.${index}.price`, { valueAsNumber: true })}
                          className="w-full border rounded px-2 py-1 text-sm text-right"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          {...register(`items.${index}.qty`, { valueAsNumber: true })}
                          className="w-full border rounded px-2 py-1 text-sm text-right"
                        />
                      </td>
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddItem}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + {t('Add product')}
          </button>

          {itemFields.length > 0 && (
            <div className="text-right text-sm font-medium mt-2">
              {t('Total')}: {itemsTotal.toFixed(2)}
            </div>
          )}
        </div>

        <div className="border-t pt-4 mt-4">
          <EavFieldsForm
            ref={eavFieldsRef}
            entityCode="order"
            value={customFields}
            onChange={setCustomFields}
          />
        </div>

        <LocalFieldsEditor value={localFields} onChange={setLocalFields} />

        <div className="flex gap-2">
          <Button type="submit" disabled={createOrder.isPending}>
            {createOrder.isPending ? t('Creating...') : t('Create order')}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('../orders')}>
            {t('Cancel')}
          </Button>
        </div>
      </form>
    </div>
  )
}
