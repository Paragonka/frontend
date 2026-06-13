import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { useDeleteEavAttribute, useEavAttributes } from '../hooks/useEavAttributes'
import { EavAttributeCreateDialog } from './EavAttributeCreateDialog'

export function EavAttributeList() {
  const { t } = useTranslation()
  const [entityCode, setEntityCode] = useState<'client' | 'product' | 'order'>('client')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: attributes, isLoading } = useEavAttributes(entityCode)
  const deleteEavAttribute = useDeleteEavAttribute()

  if (isLoading) return <div>{t('Loading...')}</div>

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">{t('EAV Attributes')}</h1>
        <div className="flex gap-2">
          <select
            value={entityCode}
            onChange={(e) => setEntityCode(e.target.value as 'client' | 'product' | 'order')}
            className="border rounded px-3 py-2"
          >
            <option value="client">{t('Client')}</option>
            <option value="product">{t('Product')}</option>
            <option value="order">{t('Order')}</option>
          </select>
          <Button type="button" onClick={() => setDialogOpen(true)}>
            {t('New Attribute')}
          </Button>
        </div>
      </div>

      <EavAttributeCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultEntityCode={entityCode}
      />

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[580px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">{t('Name')}</th>
              <th className="text-left p-3">{t('Code')}</th>
              <th className="text-left p-3">{t('Type')}</th>
              <th className="text-left p-3">{t('Required')}</th>
              <th className="text-left p-3">{t('Default value')}</th>
              <th className="text-left p-3">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {attributes?.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-3 text-center text-gray-500">
                  {t('No attributes for this entity type')}
                </td>
              </tr>
            ) : (
              attributes?.map((attr) => (
                <tr key={attr.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{attr.name}</td>
                  <td className="p-3 font-mono text-sm">{attr.code}</td>
                  <td className="p-3">
                    {t(attr.field_type.charAt(0).toUpperCase() + attr.field_type.slice(1))}
                  </td>
                  <td className="p-3">{attr.is_required ? t('Yes') : t('No')}</td>
                  <td className="p-3 text-gray-500">{attr.default_value || '—'}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`${t('Delete attribute')}?`)) {
                          deleteEavAttribute.mutate(attr.id)
                        }
                      }}
                      className="text-red-600 hover:underline"
                    >
                      {t('Delete')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
