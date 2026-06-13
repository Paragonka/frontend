import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { ApiError } from '@/shared/api/errors'
import { useChangePassword } from '../hooks/useAuth'

const buildChangePasswordSchema = (t: (key: string) => string) =>
  z
    .object({
      current_password: z.string().min(1, t('Enter your current password')),
      new_password: z.string().min(8, t('New password must be at least 8 characters')),
      confirm_password: z.string().min(1, t('Confirm your new password')),
    })
    .refine((data) => data.new_password === data.confirm_password, {
      path: ['confirm_password'],
      message: t('Passwords do not match'),
    })

type ChangePasswordForm = z.infer<ReturnType<typeof buildChangePasswordSchema>>

function getErrorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 401) return t('Current password is incorrect')
    if (error.status === 500) return t('Server error. Please try again later.')
    return error.message
  }
  if (error instanceof Error) return error.message
  return t('An unexpected error occurred')
}

export function ChangePasswordSection() {
  const { t } = useTranslation()
  const changePasswordMutation = useChangePassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(buildChangePasswordSchema(t)),
  })

  const onSubmit = (data: ChangePasswordForm) =>
    changePasswordMutation.mutate({
      current_password: data.current_password,
      new_password: data.new_password,
    })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <p className="text-sm text-gray-500">
        {t('Changing your password signs you out on all devices.')}
      </p>

      {changePasswordMutation.error && (
        <div role="alert" className="text-red-600 text-sm">
          {getErrorMessage(changePasswordMutation.error, t)}
        </div>
      )}

      <div>
        <input
          {...register('current_password')}
          type="password"
          placeholder={t('Current password')}
          autoComplete="current-password"
          className="w-full border rounded px-3 py-2"
        />
        {errors.current_password && (
          <p className="text-red-500 text-xs">{errors.current_password.message}</p>
        )}
      </div>

      <div>
        <input
          {...register('new_password')}
          type="password"
          placeholder={t('New password')}
          autoComplete="new-password"
          className="w-full border rounded px-3 py-2"
        />
        {errors.new_password && (
          <p className="text-red-500 text-xs">{errors.new_password.message}</p>
        )}
      </div>

      <div>
        <input
          {...register('confirm_password')}
          type="password"
          placeholder={t('Confirm new password')}
          autoComplete="new-password"
          className="w-full border rounded px-3 py-2"
        />
        {errors.confirm_password && (
          <p className="text-red-500 text-xs">{errors.confirm_password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={changePasswordMutation.isPending}
        className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {changePasswordMutation.isPending ? t('Saving...') : t('Change password')}
      </button>
    </form>
  )
}
