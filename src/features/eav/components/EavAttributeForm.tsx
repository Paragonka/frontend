import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { useCreateEavAttribute } from '../hooks/useEavAttributes'
import { slugifyCode } from '../lib/transliterate'

const eavAttributeSchema = z.object({
  entity_code: z.enum(['client', 'product', 'order']),
  code: z.string().trim().min(1, 'Code is required'),
  name: z.string().trim().min(1, 'Name is required'),
  field_type: z.enum(['string', 'number', 'boolean', 'date', 'text']),
  is_required: z.boolean().optional(),
  default_value: z.string().optional(),
})

type EavAttributeFormData = z.infer<typeof eavAttributeSchema>

interface EavAttributeFormProps {
  onSuccess?: () => void
  defaultEntityCode?: 'client' | 'product' | 'order'
}

export function EavAttributeForm({
  onSuccess,
  defaultEntityCode = 'client',
}: EavAttributeFormProps) {
  const { t } = useTranslation()
  const createEavAttribute = useCreateEavAttribute()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EavAttributeFormData>({
    resolver: zodResolver(eavAttributeSchema),
    defaultValues: {
      entity_code: defaultEntityCode,
      field_type: 'string',
      is_required: false,
      default_value: '',
    },
  })

  const onSubmit = (data: EavAttributeFormData) => {
    createEavAttribute.mutate(data, {
      onSuccess: () => {
        reset()
        onSuccess?.()
      },
    })
  }

  const nameValue = watch('name')
  const codeTouched = useRef(false)

  useEffect(() => {
    // Auto-generate the code from the name using transliteration, but only
    // while the user has not manually edited the code field themselves.
    if (nameValue && !codeTouched.current) {
      const slug = slugifyCode(nameValue)
      setValue('code', slug)
    }
  }, [nameValue, setValue])

  const { isError, error } = createEavAttribute

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {isError && (
        <p role="alert" className="text-red-500 text-xs">
          {error?.message}
        </p>
      )}
      <div>
        <label htmlFor="entity_code" className="block text-sm font-medium mb-1">
          {t('Type')}
        </label>
        <select
          id="entity_code"
          {...register('entity_code')}
          className="w-full border rounded px-3 py-2"
        >
          <option value="client">{t('Client')}</option>
          <option value="product">{t('Product')}</option>
          <option value="order">{t('Order')}</option>
        </select>
        {errors.entity_code && <p className="text-red-500 text-xs">{errors.entity_code.message}</p>}
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          {t('Name')}
        </label>
        <input id="name" {...register('name')} className="w-full border rounded px-3 py-2" />
        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-medium mb-1">
          {t('Code')}
        </label>
        <input
          id="code"
          {...register('code', {
            onChange: () => {
              codeTouched.current = true
            },
          })}
          className="w-full border rounded px-3 py-2 font-mono"
        />
        {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}
      </div>

      <div>
        <label htmlFor="field_type" className="block text-sm font-medium mb-1">
          {t('Type')}
        </label>
        <select
          id="field_type"
          {...register('field_type')}
          className="w-full border rounded px-3 py-2"
        >
          <option value="string">{t('String')}</option>
          <option value="number">{t('Number')}</option>
          <option value="boolean">{t('Yes/No')}</option>
          <option value="date">{t('Date')}</option>
          <option value="text">{t('Text')}</option>
        </select>
        {errors.field_type && <p className="text-red-500 text-xs">{errors.field_type.message}</p>}
      </div>

      <div>
        <label htmlFor="is_required" className="flex items-center gap-2">
          <input
            id="is_required"
            type="checkbox"
            {...register('is_required')}
            className="rounded"
          />
          <span className="text-sm font-medium">{t('Required')}</span>
        </label>
      </div>

      <div>
        <label htmlFor="default_value" className="block text-sm font-medium mb-1">
          {t('Default value')}
        </label>
        <input
          id="default_value"
          {...register('default_value')}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="submit"
          disabled={createEavAttribute.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {t('Create')}
        </button>
      </div>
    </form>
  )
}
