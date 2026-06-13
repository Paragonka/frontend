import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { ApiError } from '@/shared/api/errors'
import { useForgotPassword } from '../hooks/useAuth'

const buildForgotPasswordSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t('Enter a valid email')),
  })

type ForgotPasswordForm = z.infer<ReturnType<typeof buildForgotPasswordSchema>>

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const forgotPasswordMutation = useForgotPassword()

  function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
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
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(buildForgotPasswordSchema(t)),
  })

  const onSubmit = (data: ForgotPasswordForm) => forgotPasswordMutation.mutate(data)

  const resetUrl = forgotPasswordMutation.data?.reset_url

  // The backend returns reset_url only in development. Never render it in a
  // production build even if the API misbehaves: a leaked reset token is
  // account takeover.
  const devResetUrl = import.meta.env.DEV ? resetUrl : undefined

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h1 className="text-2xl font-bold text-center">{t('Reset password')}</h1>
      <p className="text-sm text-gray-600 text-center">
        {t('Enter your account email to receive a password reset link')}
      </p>

      {forgotPasswordMutation.error && (
        <div className="text-red-600 text-sm">{getErrorMessage(forgotPasswordMutation.error)}</div>
      )}

      {forgotPasswordMutation.isSuccess && (
        <div className="text-green-600 text-sm">
          {t('If an account exists, a reset link has been sent.')}
          {devResetUrl && (
            <div className="mt-1 break-all">
              <a href={devResetUrl} className="text-blue-600 underline">
                {t('Reset link (dev mode)')}
              </a>
            </div>
          )}
        </div>
      )}

      <div>
        <input
          {...register('email')}
          placeholder={t('Email')}
          className="w-full border rounded px-3 py-2"
        />
        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
      </div>

      <button
        type="submit"
        disabled={forgotPasswordMutation.isPending}
        className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {forgotPasswordMutation.isPending ? t('Sending...') : t('Send reset link')}
      </button>

      <p className="text-center text-sm">
        {t('Remembered your password?')}{' '}
        <a href="/login" className="text-blue-600">
          {t('Back to login')}
        </a>
      </p>
    </form>
  )
}
