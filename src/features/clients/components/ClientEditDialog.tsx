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
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useClient, useUpdateClient } from '../hooks/useClients'
import type { ClientUpdate } from '../types'

const buildClientSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t('Name is required')),
    surname: z.string().optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
  })

type ClientFormData = z.infer<ReturnType<typeof buildClientSchema>>

interface ClientEditDialogProps {
  clientId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientEditDialog({ clientId, open, onOpenChange }: ClientEditDialogProps) {
  const { t } = useTranslation()
  const { data: client } = useClient(clientId)
  const updateClient = useUpdateClient()
  const { data: photos = [] } = useEntityPhotos('clients', clientId)
  const deleteMedia = useDeleteMedia()
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({})
  const [localFields, setLocalFields] = useState<LocalFieldsValue>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const eavFieldsRef = useRef<EavFieldsFormHandle>(null)

  useEffect(() => {
    setCustomFields(client?.custom_fields ?? {})
    setLocalFields(client?.local_fields ?? {})
  }, [client])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(buildClientSchema(t)),
    values: client
      ? {
          name: client.name,
          surname: client.surname,
          phone: client.phone,
          notes: client.notes,
        }
      : undefined,
  })

  const onSubmit = async (data: ClientFormData) => {
    if (!eavFieldsRef.current?.validate()) return
    const payload: ClientUpdate = {
      ...data,
      custom_fields: customFields,
      local_fields: normalizeLocalFields(localFields),
    }
    setSubmitError(null)
    try {
      await updateClient.mutateAsync({ id: clientId, input: payload })
      onOpenChange(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('An unexpected error occurred'))
    }
  }

  const handleDeletePhoto = (key: string) => {
    if (window.confirm(t('Are you sure you want to delete this photo?'))) {
      deleteMedia.mutate(key)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Edit client')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium mb-1">
              {t('First name *')}
            </label>
            <input
              id="edit-name"
              {...register('name')}
              className="w-full border rounded px-3 py-2"
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="edit-surname" className="block text-sm font-medium mb-1">
              {t('Last name')}
            </label>
            <input
              id="edit-surname"
              {...register('surname')}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="edit-phone" className="block text-sm font-medium mb-1">
              {t('Phone')}
            </label>
            <input
              id="edit-phone"
              {...register('phone')}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="edit-notes" className="block text-sm font-medium mb-1">
              {t('Notes')}
            </label>
            <textarea
              id="edit-notes"
              {...register('notes')}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <PhotoGallery photos={photos} onDelete={handleDeletePhoto} />
          </div>

          <div className="border-t pt-4 mt-4">
            <PhotoUpload entityType="clients" entityId={clientId} />
          </div>

          <div className="border-t pt-4 mt-4">
            <EavFieldsForm
              ref={eavFieldsRef}
              entityCode="client"
              value={customFields}
              onChange={setCustomFields}
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <LocalFieldsEditor value={localFields} onChange={setLocalFields} />
          </div>

          {submitError && (
            <p role="alert" className="text-red-500 text-sm">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={updateClient.isPending}>
              {updateClient.isPending ? t('Saving...') : t('Save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
