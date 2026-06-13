import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useDeleteOrg, useOrgs } from '../hooks/useOrgs'

interface DangerZoneProps {
  orgId: string
}

export function DangerZone({ orgId }: DangerZoneProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: orgs } = useOrgs()
  const deleteOrg = useDeleteOrg()
  const org = orgs?.find((o) => o.id === orgId)
  const orgName = org?.name ?? ''
  const [open, setOpen] = useState(false)
  const [typedName, setTypedName] = useState('')

  const matches = typedName === orgName && orgName !== ''
  const close = () => {
    setOpen(false)
    setTypedName('')
  }

  const handleDelete = () => {
    deleteOrg.mutate(orgId, {
      onSuccess: () => navigate('/orgs/select', { replace: true }),
    })
  }

  return (
    <div className="bg-white rounded-lg border border-red-200 p-4 max-w-md">
      <h2 className="text-base font-semibold mb-1 text-red-700">{t('Delete organization')}</h2>
      <p className="text-sm text-gray-500 mb-3">
        {t(
          'Permanently deletes the organization with all clients, products, orders, receipts and settings. This action cannot be undone.',
        )}
      </p>
      <button
        type="button"
        data-testid="delete-org-button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700"
      >
        {t('Delete organization')}
      </button>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">{t('Delete organization')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <p className="text-gray-600">
              {t('You are about to permanently delete the organization')}{' '}
              <span className="font-semibold text-gray-900">{orgName}</span>.{' '}
              {t(
                'All data — clients, products, orders, receipts and settings — will be removed forever.',
              )}
            </p>
            <p className="text-gray-600">{t('Type the organization name to confirm')}:</p>
            <input
              aria-label={t('Type the organization name to confirm')}
              data-testid="delete-org-confirm-input"
              value={typedName}
              autoFocus
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={orgName}
              className="w-full border rounded px-3 py-2 bg-white"
            />
            {deleteOrg.isError && (
              <p role="alert" className="text-sm text-red-600">
                {t('Failed to delete organization')}
              </p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={close}
              disabled={deleteOrg.isPending}
              className="px-4 py-2 rounded border text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {t('Cancel')}
            </button>
            <button
              type="button"
              data-testid="delete-org-confirm-button"
              onClick={handleDelete}
              disabled={!matches || deleteOrg.isPending}
              className="px-4 py-2 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteOrg.isPending ? t('Deleting...') : t('Delete forever')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
