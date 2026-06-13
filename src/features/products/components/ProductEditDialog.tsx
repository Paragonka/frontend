import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { EavFieldsForm, type EavFieldsFormHandle } from '@/features/eav/components/EavFieldsForm'
import { PhotoGallery } from '@/features/media/components/PhotoGallery'
import { PhotoUpload } from '@/features/media/components/PhotoUpload'
import { useDeleteMedia, useEntityPhotos } from '@/features/media/hooks/useMedia'
import {
  LocalFieldsEditor,
  type LocalFieldsValue,
  normalizeLocalFields,
} from '@/shared/components/LocalFieldsEditor'
import { PRODUCT_TYPES } from '@/shared/constants'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useProduct, useUpdateProduct } from '../hooks/useProducts'
import type { ProductUpdate } from '../types'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().optional(),
  unit: z.string().optional(),
  product_type: z.enum(PRODUCT_TYPES).optional(),
  price: z.number().min(0).optional(),
  cost_price: z.number().min(0).optional(),
  stock_qty: z
    .preprocess(
      (value) => (value === '' || value === null || Number.isNaN(value) ? null : Number(value)),
      z.number().min(0, 'Stock quantity must be at least 0').nullable(),
    )
    .optional(),
  track_inventory: z.boolean().optional(),
  is_sellable: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

type ProductFormInput = z.input<typeof productSchema>
type ProductFormData = z.output<typeof productSchema>

interface ProductEditDialogProps {
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductEditDialog({ productId, open, onOpenChange }: ProductEditDialogProps) {
  const { t } = useTranslation()
  const { data: product } = useProduct(productId)
  const updateProduct = useUpdateProduct()
  const { data: photos = [] } = useEntityPhotos('products', productId)
  const deleteMedia = useDeleteMedia()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({})
  const [localFields, setLocalFields] = useState<LocalFieldsValue>({})
  const eavFieldsRef = useRef<EavFieldsFormHandle>(null)

  useEffect(() => {
    setCustomFields(product?.custom_fields ?? {})
    setLocalFields(product?.local_fields ?? {})
  }, [product])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productSchema),
    values: product
      ? {
          name: product.name,
          category: product.category,
          unit: product.unit,
          product_type: product.product_type,
          price: Number(product.price),
          cost_price: Number(product.cost_price),
          stock_qty: product.stock_qty,
          track_inventory: product.track_inventory,
          is_sellable: product.is_sellable,
          is_active: product.is_active,
        }
      : undefined,
  })

  const onSubmit = async (data: ProductFormData) => {
    try {
      setSubmitError(null)
      if (!eavFieldsRef.current?.validate()) return
      const payload: ProductUpdate = {
        ...data,
        custom_fields: customFields,
        local_fields: normalizeLocalFields(localFields),
      }
      await updateProduct.mutateAsync({ id: productId, input: payload })
      onOpenChange(false)
    } catch (err) {
      // Keep the dialog open on API errors - never navigate away.
      setSubmitError(err instanceof Error ? err.message : t('An unexpected error occurred'))
    }
  }

  const handleDeletePhoto = (key: string) => {
    if (window.confirm(t('Are you sure you want to delete this photo?'))) {
      deleteMedia.mutate(key)
    }
  }

  const typeLabels: Record<string, string> = {
    good: t('Good'),
    service: t('Service'),
    material: t('Material'),
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('Edit product')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium mb-1">
              {t('Name *')}
            </label>
            <input
              id="edit-name"
              {...register('name')}
              className="w-full border rounded px-3 py-2"
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="edit-category" className="block text-sm font-medium mb-1">
              {t('Category')}
            </label>
            <input
              id="edit-category"
              {...register('category')}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="edit-unit" className="block text-sm font-medium mb-1">
              {t('Unit')}
            </label>
            <input
              id="edit-unit"
              {...register('unit')}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="edit-product_type" className="block text-sm font-medium mb-1">
              {t('Product type')}
            </label>
            <select
              id="edit-product_type"
              {...register('product_type')}
              className="w-full border rounded px-3 py-2"
            >
              {PRODUCT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-price" className="block text-sm font-medium mb-1">
              {t('Price')}
            </label>
            <input
              id="edit-price"
              type="number"
              step="0.01"
              min="0"
              {...register('price', { valueAsNumber: true })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="edit-cost_price" className="block text-sm font-medium mb-1">
              {t('Cost price')}
            </label>
            <input
              id="edit-cost_price"
              type="number"
              step="0.01"
              min="0"
              {...register('cost_price', { valueAsNumber: true })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="edit-is_active"
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4"
            />
            <label htmlFor="edit-is_active" className="text-sm font-medium">
              {t('Active')}
            </label>
          </div>

          <div>
            <label htmlFor="edit-stock_qty" className="block text-sm font-medium mb-1">
              {t('Stock quantity')}
            </label>
            <input
              id="edit-stock_qty"
              type="number"
              step="any"
              min="0"
              {...register('stock_qty', { valueAsNumber: true })}
              className="w-full border rounded px-3 py-2"
            />
            {errors.stock_qty && <p className="text-red-500 text-xs">{errors.stock_qty.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="edit-track_inventory"
              type="checkbox"
              {...register('track_inventory')}
              className="h-4 w-4"
            />
            <label htmlFor="edit-track_inventory" className="text-sm font-medium">
              {t('Track inventory')}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="edit-is_sellable"
              type="checkbox"
              {...register('is_sellable')}
              className="h-4 w-4"
            />
            <label htmlFor="edit-is_sellable" className="text-sm font-medium">
              {t('Sellable')}
            </label>
          </div>

          <div className="border-t pt-4 mt-4">
            <PhotoGallery photos={photos} onDelete={handleDeletePhoto} />
          </div>

          <div className="border-t pt-4 mt-4">
            <PhotoUpload entityType="products" entityId={productId} />
          </div>

          <div className="border-t pt-4 mt-4">
            <EavFieldsForm
              ref={eavFieldsRef}
              entityCode="product"
              value={customFields}
              onChange={setCustomFields}
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <LocalFieldsEditor value={localFields} onChange={setLocalFields} />
          </div>

          {submitError && <p className="text-red-500 text-sm">{submitError}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={updateProduct.isPending}>
              {updateProduct.isPending ? t('Saving...') : t('Save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
