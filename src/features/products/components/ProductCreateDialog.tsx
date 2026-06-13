import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { EavFieldsForm, type EavFieldsFormHandle } from '@/features/eav/components/EavFieldsForm'
import { uploadPhoto } from '@/features/media/api'
import { PRODUCT_TYPES } from '@/shared/constants'
import { useAuthStore } from '@/shared/store/auth'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useAllProducts, useCreateProduct } from '../hooks/useProducts'
import type { ProductComponentInput, ProductCreate } from '../types'

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
  components: z
    .array(
      z.object({
        product_id: z.string().min(1, 'Product is required'),
        quantity: z.number().min(0.0001, 'Quantity must be greater than 0'),
      }),
    )
    .optional(),
})

type ProductFormInput = z.input<typeof productSchema>
type ProductFormData = z.output<typeof productSchema>

interface ProductCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductCreateDialog({ open, onOpenChange }: ProductCreateDialogProps) {
  const { t } = useTranslation()
  const createProduct = useCreateProduct()
  const orgId = useAuthStore((s) => s.currentOrgId) ?? ''
  const { data: allProducts = [] } = useAllProducts()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({})
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const eavFieldsRef = useRef<EavFieldsFormHandle>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      unit: '',
      product_type: 'good',
      price: 0,
      cost_price: 0,
      stock_qty: null,
      track_inventory: true,
      is_sellable: true,
      is_active: true,
      components: [],
    },
  })

  const {
    fields: componentFields,
    append: addComponent,
    remove: removeComponent,
  } = useFieldArray({
    control,
    name: 'components',
  })

  // Preview URL management - revoke on removal & unmount to prevent memory leaks
  const urlsRef = useRef<Map<File, string>>(new Map())
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  // Reconcile object URLs when file list changes
  useEffect(() => {
    // Revoke URLs for files no longer in the list
    for (const [file, url] of urlsRef.current) {
      if (!pendingPhotos.includes(file)) {
        URL.revokeObjectURL(url)
        urlsRef.current.delete(file)
      }
    }
    // Create URLs for new files
    const urls = pendingPhotos.map((file) => {
      const existing = urlsRef.current.get(file)
      if (existing) return existing
      const url = URL.createObjectURL(file)
      urlsRef.current.set(file, url)
      return url
    })
    setPreviewUrls(urls)
  }, [pendingPhotos])

  // Revoke all preview URLs on unmount
  useEffect(() => {
    return () => {
      for (const url of urlsRef.current.values()) URL.revokeObjectURL(url)
      urlsRef.current.clear()
    }
  }, [])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setPendingPhotos((prev) => [...prev, ...Array.from(files)])
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePendingPhoto = (index: number) => {
    setPendingPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadPendingPhotos = async (productId: string) => {
    if (pendingPhotos.length === 0) return
    setUploading(true)
    try {
      for (const file of pendingPhotos) {
        await uploadPhoto(orgId, 'products', productId, file)
      }
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    try {
      setSubmitError(null)
      if (!eavFieldsRef.current?.validate()) return
      const components: ProductComponentInput[] = (data.components ?? [])
        .filter((c) => c.product_id && c.quantity > 0)
        .map((c) => ({ product_id: c.product_id, quantity: c.quantity }))
      const payload: ProductCreate = { ...data, custom_fields: customFields, components }
      const created = await createProduct.mutateAsync(payload)
      await uploadPendingPhotos(created.id)
      reset()
      setCustomFields({})
      setPendingPhotos([])
      onOpenChange(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('An unexpected error occurred'))
    }
  }

  const typeLabels: Record<string, string> = useMemo(
    () => ({
      good: t('Good'),
      service: t('Service'),
      material: t('Material'),
    }),
    [t],
  )

  const availableProducts = allProducts.filter((p) => p.is_active)

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          reset()
          setCustomFields({})
          setPendingPhotos([])
          onOpenChange(false)
        }
      }}
    >
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('New Product')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="create-name" className="block text-sm font-medium mb-1">
              {t('Name *')}
            </label>
            <input
              id="create-name"
              {...register('name')}
              className="w-full border rounded px-3 py-2"
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="create-category" className="block text-sm font-medium mb-1">
              {t('Category')}
            </label>
            <input
              id="create-category"
              {...register('category')}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="create-unit" className="block text-sm font-medium mb-1">
              {t('Unit')}
            </label>
            <input
              id="create-unit"
              {...register('unit')}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="create-product_type" className="block text-sm font-medium mb-1">
              {t('Product type')}
            </label>
            <select
              id="create-product_type"
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
            <label htmlFor="create-price" className="block text-sm font-medium mb-1">
              {t('Price')}
            </label>
            <input
              id="create-price"
              type="number"
              step="0.01"
              min="0"
              {...register('price', { valueAsNumber: true })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="create-cost_price" className="block text-sm font-medium mb-1">
              {t('Cost price')}
            </label>
            <input
              id="create-cost_price"
              type="number"
              step="0.01"
              min="0"
              {...register('cost_price', { valueAsNumber: true })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="create-is_active"
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4"
            />
            <label htmlFor="create-is_active" className="text-sm font-medium">
              {t('Active')}
            </label>
          </div>

          <div>
            <label htmlFor="create-stock_qty" className="block text-sm font-medium mb-1">
              {t('Stock quantity')}
            </label>
            <input
              id="create-stock_qty"
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
              id="create-track_inventory"
              type="checkbox"
              {...register('track_inventory')}
              className="h-4 w-4"
            />
            <label htmlFor="create-track_inventory" className="text-sm font-medium">
              {t('Track inventory')}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="create-is_sellable"
              type="checkbox"
              {...register('is_sellable')}
              className="h-4 w-4"
            />
            <label htmlFor="create-is_sellable" className="text-sm font-medium">
              {t('Sellable')}
            </label>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-2">{t('Composition')}</h3>
            <p className="text-sm text-gray-500 mb-2">
              {t('Add products and quantity for manufacturing')}
            </p>
            <div className="space-y-2">
              {componentFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_8rem_auto] gap-2 items-end">
                  <div>
                    <label
                      htmlFor={`component-product-${field.id}`}
                      className="block text-xs text-gray-500 mb-1"
                    >
                      {t('Product')}
                    </label>
                    <select
                      id={`component-product-${field.id}`}
                      {...register(`components.${index}.product_id`)}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="">{t('Select product')}</option>
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor={`component-qty-${field.id}`}
                      className="block text-xs text-gray-500 mb-1"
                    >
                      {t('Quantity')}
                    </label>
                    <input
                      id={`component-qty-${field.id}`}
                      type="number"
                      step="any"
                      min="0.0001"
                      {...register(`components.${index}.quantity`, { valueAsNumber: true })}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeComponent(index)}
                    className="text-red-500 hover:text-red-700 text-sm px-2 py-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addComponent({ product_id: '', quantity: 1 })}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              + {t('Add product')}
            </button>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-2">{t('Photos')}</h3>
            {pendingPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {pendingPhotos.map((file, index) => (
                  <div key={`${file.name}-${file.lastModified}`} className="relative group">
                    <img
                      src={previewUrls[index]}
                      alt={t('Preview')}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removePendingPhoto(index)}
                      className="absolute top-0 right-0 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <p className="text-gray-500 text-sm">{t('Click to select photos')}</p>
              <p className="text-xs text-gray-400">{t('JPEG, PNG, WebP — max 10 MB')}</p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
            {uploading && <p className="text-sm text-blue-600 mt-2">{t('Uploading photos...')}</p>}
          </div>

          <div className="border-t pt-4 mt-4">
            <EavFieldsForm
              ref={eavFieldsRef}
              entityCode="product"
              value={customFields}
              onChange={setCustomFields}
            />
          </div>

          {submitError && <p className="text-red-500 text-sm">{submitError}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setCustomFields({})
                setPendingPhotos([])
                onOpenChange(false)
              }}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={createProduct.isPending || uploading}>
              {createProduct.isPending
                ? t('Creating...')
                : uploading
                  ? t('Uploading photos...')
                  : t('Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
