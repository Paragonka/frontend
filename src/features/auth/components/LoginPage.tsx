import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '@/shared/api/errors'
import { PasswordVisibilityToggle } from '@/shared/ui/PasswordVisibilityToggle'
import { useLogin } from '../hooks/useAuth'

const buildLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t('Enter a valid email')),
    password: z.string().min(1, t('Enter your password')),
  })

type LoginForm = z.infer<ReturnType<typeof buildLoginSchema>>

export function LoginPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const loginMutation = useLogin()
  const [showPassword, setShowPassword] = useState(false)

  // Set by the forced re-login after a successful password change.
  const passwordChanged =
    (location.state as { passwordChanged?: boolean } | null)?.passwordChanged === true

  function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
      if (error.status === 401) return t('Invalid email or password')
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
  } = useForm<LoginForm>({
    resolver: zodResolver(buildLoginSchema(t)),
  })

  const onSubmit = (data: LoginForm) => loginMutation.mutate(data)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h1 className="text-2xl font-bold text-center">{t('Log in')}</h1>

      {passwordChanged && (
        <div role="status" className="text-green-600 text-sm text-center">
          {t('Your password has been changed. Sign in with your new password.')}
        </div>
      )}

      {loginMutation.error && (
        <div className="text-red-600 text-sm">{getErrorMessage(loginMutation.error)}</div>
      )}

      <div>
        <input
          {...register('email')}
          placeholder={t('Email')}
          className="w-full border rounded px-3 py-2"
        />
        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
      </div>

      <div className="relative">
        <input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          placeholder={t('Password')}
          className="w-full border rounded px-3 py-2 pr-10"
        />
        <PasswordVisibilityToggle
          visible={showPassword}
          onToggle={() => setShowPassword((v) => !v)}
        />
        {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
      </div>

      <div className="text-right">
        <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
          {t('Forgot password?')}
        </a>
      </div>

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {loginMutation.isPending ? t('Logging in...') : t('Sign in')}
      </button>

      <p className="text-center text-sm">
        {t('No account?')}{' '}
        <a href="/register" className="text-blue-600">
          {t('Sign up')}
        </a>
      </p>
    </form>
  )
}
