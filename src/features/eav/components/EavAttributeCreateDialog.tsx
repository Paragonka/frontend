import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { EavAttributeForm } from './EavAttributeForm'

interface EavAttributeCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEntityCode?: 'client' | 'product' | 'order'
}

export function EavAttributeCreateDialog({
  open,
  onOpenChange,
  defaultEntityCode = 'client',
}: EavAttributeCreateDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('New Attribute')}</DialogTitle>
        </DialogHeader>
        {/* key ensures the form remounts with the active tab as its default when opened */}
        <EavAttributeForm
          key={open ? defaultEntityCode : undefined}
          defaultEntityCode={defaultEntityCode}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
