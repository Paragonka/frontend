import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FALLBACK_CURRENCY } from '../hooks/useCurrency'
import { useOrgSettings, useUpdateOrgSettings } from '../hooks/useOrgs'
import { ALLOWED_CURRENCIES } from '../types'

interface CurrencySectionProps {
  orgId: string
}

export function CurrencySection({ orgId }: CurrencySectionProps) {
  const { t } = useTranslation()
  const { data: settings, isLoading } = useOrgSettings(orgId)
  const updateSettings = useUpdateOrgSettings(orgId)
  const [selected, setSelected] = useState('')

  // Local selection until saved; falls back to the server value, then PLN.
  const current = selected || settings?.currency || FALLBACK_CURRENCY
  const isDirty = Boolean(selected) && selected !== (settings?.currency ?? '')

  const handleSave = () => {
    updateSettings.mutate(
      { currency: current as (typeof ALLOWED_CURRENCIES)[number] },
      { onSuccess: () => setSelected('') },
    )
  }

  return (
    <div className="bg-white rounded-lg border p-4 max-w-md">
      <h2 className="text-base font-semibold mb-1">{t('Currency')}</h2>
      <p className="text-sm text-gray-500 mb-3">
        {t('Used for all money amounts in this organization.')}
      </p>

      <div className="flex items-center gap-2">
        <select
          aria-label={t('Currency')}
          data-testid="currency-select"
          value={current}
          disabled={isLoading || updateSettings.isPending}
          onChange={(e) => setSelected(e.target.value)}
          className="border rounded px-3 py-2 bg-white"
        >
          {ALLOWED_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <button
          type="button"
          data-testid="currency-save"
          disabled={!isDirty || updateSettings.isPending}
          onClick={handleSave}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateSettings.isPending ? t('Saving...') : t('Save')}
        </button>
      </div>

      {updateSettings.isError && (
        <p role="alert" className="text-sm text-red-600 mt-2">
          {t('Failed to save settings')}
        </p>
      )}
      {updateSettings.isSuccess && !isDirty && (
        <p role="status" className="text-sm text-green-700 mt-2">
          {t('Settings saved')}
        </p>
      )}
    </div>
  )
}
