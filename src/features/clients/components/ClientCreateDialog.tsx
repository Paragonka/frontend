import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { EavFieldsForm, type EavFieldsFormHandle } from '@/features/eav/components/EavFieldsForm'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useCreateClient } from '../hooks/useClients'
import type { ClientCreate } from '../types'

const buildClientSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t('Name is required')),
    surname: z.string().optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
  })

type ClientFormData = z.infer<ReturnType<typeof buildClientSchema>>

interface ClientCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientCreateDialog({ open, onOpenChange }: ClientCreateDialogProps) {
  const { t } = useTranslation()
  const createClient = useCreateClient()
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const eavFieldsRef = useRef<EavFieldsFormHandle>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(buildClientSchema(t)),
    defaultValues: { name: '', surname: '', phone: '', notes: '' },
  })

  const onSubmit = async (data: ClientFormData) => {
    if (!eavFieldsRef.current?.validate()) return
    const payload: ClientCreate = { ...data, custom_fields: customFields }
    setSubmitError(null)
    try {
      await createClient.mutateAsync(payload)
      reset()
      setCustomFields({})
      onOpenChange(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('An unexpected error occurred'))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          reset()
          setCustomFields({})
          onOpenChange(false)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('New Client')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="create-name" className="block text-sm font-medium mb-1">
              {t('First name *')}
            </label>
            <input
              id="create-name"
              {...register('name')}
              className="w-full border rounded px-3 py-2"
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="create-surname" className="block text-sm font-medium mb-1">
              {t('Last name')}
            </label>
            <input
              id="create-surname"
              {...register('surname')}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="create-phone" className="block text-sm font-medium mb-1">
              {t('Phone')}
            </label>
            <input
              id="create-phone"
              {...register('phone')}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="create-notes" className="block text-sm font-medium mb-1">
              {t('Notes')}
            </label>
            <textarea
              id="create-notes"
              {...register('notes')}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <EavFieldsForm
              ref={eavFieldsRef}
              entityCode="client"
              value={customFields}
              onChange={setCustomFields}
            />
          </div>

          {submitError && (
            <p role="alert" className="text-red-500 text-sm">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setCustomFields({})
                onOpenChange(false)
              }}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={createClient.isPending}>
              {createClient.isPending ? t('Creating...') : t('Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
