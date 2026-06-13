import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEavAttributes } from '../hooks/useEavAttributes'
import type { EavAttribute } from '../types'

export interface EavFieldsFormHandle {
  validate: () => boolean
}

interface EavFieldsFormProps {
  entityCode: 'client' | 'product' | 'order'
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}

const EMPTY_ATTRIBUTES: EavAttribute[] = []

function isFilled(attr: EavAttribute, raw: unknown): boolean {
  if (attr.field_type === 'boolean') {
    return raw === true || raw === 'true' || raw === 1 || raw === '1'
  }
  if (attr.field_type === 'number') {
    if (raw == null) return false
    const str = String(raw).trim()
    return str !== '' && !Number.isNaN(Number(str))
  }
  if (attr.field_type === 'date') {
    return raw != null && String(raw) !== ''
  }
  return raw != null && String(raw).trim() !== ''
}

function isChecked(raw: unknown): boolean {
  return raw === true || raw === 'true' || raw === 1 || raw === '1'
}

function toDisplayString(raw: unknown): string {
  if (raw == null || raw === '') return ''
  return String(raw)
}

export const EavFieldsForm = forwardRef<EavFieldsFormHandle, EavFieldsFormProps>(
  function EavFieldsForm({ entityCode, value, onChange }, ref) {
    const { t } = useTranslation()
    const { data, isLoading } = useEavAttributes(entityCode)
    const attributes = data ?? EMPTY_ATTRIBUTES

    const valueRef = useRef(value)
    valueRef.current = value
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange

    const [errors, setErrors] = useState<Record<string, boolean>>({})

    useEffect(() => {
      if (isLoading || attributes.length === 0) return
      const next = { ...valueRef.current }
      let changed = false
      for (const attr of attributes) {
        const current = next[attr.code]
        const empty = current == null || current === ''
        if (empty && attr.default_value !== '') {
          next[attr.code] = attr.default_value
          changed = true
        }
      }
      if (changed) {
        onChangeRef.current(next)
      }
    }, [attributes, isLoading])

    useImperativeHandle(
      ref,
      () => ({
        validate() {
          const missing: Record<string, boolean> = {}
          for (const attr of attributes) {
            if (attr.is_required && !isFilled(attr, valueRef.current[attr.code])) {
              missing[attr.code] = true
            }
          }
          setErrors(missing)
          return Object.keys(missing).length === 0
        },
      }),
      [attributes],
    )

    if (attributes.length === 0) return null

    const updateField = (code: string, fieldValue: unknown) => {
      setErrors((prev) => {
        if (!prev[code]) return prev
        const next = { ...prev }
        delete next[code]
        return next
      })
      onChange({ ...value, [code]: fieldValue })
    }

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">{t('Additional fields')}</h3>
        {attributes.map((attr) => {
          const fieldId = `eav-field-${attr.code}`
          const label = attr.is_required ? `${attr.name} *` : attr.name
          const errorText = errors[attr.code] && (
            <p className="text-red-500 text-xs">{t('Fill in the required field')}</p>
          )

          if (attr.field_type === 'boolean') {
            return (
              <div key={attr.id}>
                <label htmlFor={fieldId} className="flex items-center gap-2 text-sm font-medium">
                  <input
                    id={fieldId}
                    type="checkbox"
                    checked={isChecked(value[attr.code])}
                    onChange={(e) => updateField(attr.code, e.target.checked)}
                    className="rounded"
                  />
                  <span>{label}</span>
                </label>
                {errorText}
              </div>
            )
          }

          const display = Object.hasOwn(value, attr.code)
            ? toDisplayString(value[attr.code])
            : (attr.default_value ?? '')

          const sharedProps = {
            id: fieldId,
            className: 'w-full border rounded px-3 py-2',
            value: display,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              updateField(attr.code, e.target.value),
          }

          return (
            <div key={attr.id}>
              <label htmlFor={fieldId} className="block text-sm font-medium mb-1">
                {label}
              </label>
              {attr.field_type === 'text' ? (
                <textarea rows={3} {...sharedProps} />
              ) : (
                <input
                  type={
                    attr.field_type === 'number'
                      ? 'number'
                      : attr.field_type === 'date'
                        ? 'date'
                        : 'text'
                  }
                  {...sharedProps}
                />
              )}
              {errorText}
            </div>
          )
        })}
      </div>
    )
  },
)
