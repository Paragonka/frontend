import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '@/shared/api/errors'
import { useResetPassword } from '../hooks/useAuth'

const buildResetPasswordSchema = (t: (key: string) => string) =>
  z
    .object({
      password: z.string().min(8, t('Password must be at least 8 characters')),
      confirmPassword: z.string().min(1, t('Confirm your password')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: t('Passwords do not match'),
    })

type ResetPasswordForm = z.infer<ReturnType<typeof buildResetPasswordSchema>>

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const resetPasswordMutation = useResetPassword()

  function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
      if (error.status === 400) return t('Invalid or expired reset token')
      if (error.status === 500) return t('Server error. Please try again later.')
      return error.message
    }
    if (error instanceof Error) return error.message
    return t('An unexpected error occurred')
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(buildResetPasswordSchema(t)),
  })

  const onSubmit = (data: ResetPasswordForm) => {
    if (token) resetPasswordMutation.mutate({ token, password: data.password })
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">{t('Reset password')}</h1>
        <p className="text-red-600 text-sm">{t('Invalid or expired reset token')}</p>
        <a href="/forgot-password" className="text-blue-600 text-sm">
          {t('Request a new reset link')}
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h1 className="text-2xl font-bold text-center">{t('Reset password')}</h1>

      {resetPasswordMutation.error && (
        <div className="text-red-600 text-sm">{getErrorMessage(resetPasswordMutation.error)}</div>
      )}

      {resetPasswordMutation.isSuccess && (
        <div className="text-green-600 text-sm text-center">
          {t('Password has been reset')}
          <div className="mt-2">
            <a href="/login" className="text-blue-600 font-medium">
              {t('Sign in')}
            </a>
          </div>
        </div>
      )}

      <div>
        <input
          {...register('password')}
          type="password"
          placeholder={t('New password')}
          className="w-full border rounded px-3 py-2"
        />
        {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
      </div>

      <div>
        <input
          {...register('confirmPassword')}
          type="password"
          placeholder={t('Confirm password')}
          className="w-full border rounded px-3 py-2"
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={resetPasswordMutation.isPending || resetPasswordMutation.isSuccess}
        className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {resetPasswordMutation.isPending ? t('Saving...') : t('Reset password')}
      </button>

      <p className="text-center text-sm">
        {t('Remembered your password?')}{' '}
        <a href="/login" className="text-blue-600">
          {t('Sign in')}
        </a>
      </p>
    </form>
  )
}
