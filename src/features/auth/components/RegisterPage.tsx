import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { ApiError } from '@/shared/api/errors'
import { PasswordVisibilityToggle } from '@/shared/ui/PasswordVisibilityToggle'
import { useRegister } from '../hooks/useAuth'

const buildRegisterSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t('Enter a valid email')),
    password: z.string().min(8, t('Password must be at least 8 characters')),
    full_name: z.string().min(2, t('Name must be at least 2 characters')),
    consent: z.literal(true, {
      message: t('You must agree to the privacy policy and terms of use'),
    }),
  })

type RegisterForm = z.infer<ReturnType<typeof buildRegisterSchema>>

export function RegisterPage() {
  const { t } = useTranslation()
  const registerMutation = useRegister()
  const [showPassword, setShowPassword] = useState(false)

  function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
      if (error.status === 409) return t('An account with this email already exists')
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
  } = useForm<RegisterForm>({
    resolver: zodResolver(buildRegisterSchema(t)),
  })

  const onSubmit = (data: RegisterForm) =>
    registerMutation.mutate({
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      consent_to_processing: true,
    })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h1 className="text-2xl font-bold text-center">{t('Register')}</h1>

      {registerMutation.error && (
        <div className="text-red-600 text-sm">{getErrorMessage(registerMutation.error)}</div>
      )}

      <div>
        <input
          {...register('full_name')}
          placeholder={t('First name')}
          className="w-full border rounded px-3 py-2"
        />
        {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
      </div>

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

      <div className="flex items-start gap-2">
        <input type="checkbox" id="consent" {...register('consent')} className="mt-1" />
        <label htmlFor="consent" className="text-sm text-gray-700">
          {t('I agree to the')}{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            {t('privacy policy')}
          </a>{' '}
          {t('and')}{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            {t('terms of use')}
          </a>
        </label>
      </div>
      {errors.consent && <p className="text-red-500 text-xs">{errors.consent.message}</p>}

      <button
        type="submit"
        disabled={registerMutation.isPending}
        className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {registerMutation.isPending ? t('Registering...') : t('Sign up')}
      </button>

      <p className="text-center text-sm">
        {t('Already have an account?')}{' '}
        <a href="/login" className="text-blue-600">
          {t('Sign in')}
        </a>
      </p>
    </form>
  )
}
