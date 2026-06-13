import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { useCreateInvite } from '../hooks/useOrgs'
import { InvitesList } from './InvitesList'

const inviteSchema = z.object({ email: z.string().email('Enter a valid email') })
type InviteForm = z.infer<typeof inviteSchema>

function inviteFormErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

export function InviteForm({ orgId }: { orgId: string }) {
  const { t } = useTranslation()
  const createInvite = useCreateInvite(orgId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
  })

  const onSubmit = (data: InviteForm) =>
    createInvite.mutate(data, {
      onSuccess: () => reset(),
    })

  return (
    <div className="mb-6">
      <h3 className="text-md font-semibold mb-2">{t('Invite by email')}</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 max-w-md">
        <input
          {...register('email')}
          placeholder={t('Email')}
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={createInvite.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {createInvite.isPending ? t('Inviting...') : t('Invite')}
        </button>
      </form>
      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      {createInvite.error && (
        <p role="alert" className="text-red-600 text-sm mt-1">
          {inviteFormErrorMessage(createInvite.error)}
        </p>
      )}
    </div>
  )
}

export function InvitesSection({ orgId }: { orgId: string }) {
  return (
    <div>
      <InviteForm orgId={orgId} />
      <InvitesList orgId={orgId} />
    </div>
  )
}
