import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOrgs, useUpdateOrg } from '../hooks/useOrgs'

interface OrgNameSectionProps {
  orgId: string
}

export function OrgNameSection({ orgId }: OrgNameSectionProps) {
  const { t } = useTranslation()
  const { data: orgs } = useOrgs()
  const updateOrg = useUpdateOrg(orgId)
  const org = orgs?.find((o) => o.id === orgId)
  const [name, setName] = useState(org?.name ?? '')

  const isDirty = Boolean(name.trim()) && name !== org?.name
  const [justSaved, setJustSaved] = useState(false)

  const handleSave = () => {
    updateOrg.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          setJustSaved(true)
          setTimeout(() => setJustSaved(false), 3000)
        },
      },
    )
  }

  return (
    <div className="bg-white rounded-lg border p-4 max-w-md">
      <h2 className="text-base font-semibold mb-1">{t('Organization name')}</h2>
      <p className="text-sm text-gray-500 mb-3">
        {t('The name shown in the header and organization selector.')}
      </p>

      <div className="flex items-center gap-2">
        <input
          aria-label={t('Organization name')}
          data-testid="org-name-input"
          value={name}
          maxLength={255}
          onChange={(e) => setName(e.target.value)}
          disabled={updateOrg.isPending}
          className="flex-1 border rounded px-3 py-2 bg-white"
        />
        <button
          type="button"
          data-testid="org-name-save"
          disabled={!isDirty || updateOrg.isPending}
          onClick={handleSave}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateOrg.isPending ? t('Saving...') : t('Save')}
        </button>
      </div>

      {updateOrg.isError && (
        <p role="alert" className="text-sm text-red-600 mt-2">
          {t('Failed to rename organization')}
        </p>
      )}
      {justSaved && (
        <p role="status" className="text-sm text-green-700 mt-2">
          {t('Organization renamed')}
        </p>
      )}
    </div>
  )
}
