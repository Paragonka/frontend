import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError } from '@/shared/api/errors'
import { useAuthStore } from '@/shared/store/auth'
import { acceptInvite } from '../api'

export function getAcceptErrorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiError) {
    if (error.status === 410) return t('This invitation has expired.')
    if (error.status === 409) return t('This invitation has already been used.')
    return error.message
  }
  if (error instanceof Error) return error.message
  return t('Failed to accept the invitation.')
}

export function AcceptInvitePage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const user = useAuthStore((s) => s.user)
  const setCurrentOrg = useAuthStore((s) => s.setCurrentOrg)
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')
  const startedRef = useRef(false)

  useEffect(() => {
    if (!user || !token || startedRef.current) return
    startedRef.current = true
    let cancelled = false

    acceptInvite({ token })
      .then((data) => {
        if (cancelled) return
        setCurrentOrg(data.org_id)
        navigate(`/app/${data.org_id}`, { replace: true })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setErrorMessage(getAcceptErrorMessage(err, t))
      })

    return () => {
      cancelled = true
    }
  }, [user, token, navigate, setCurrentOrg, t])

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-2xl font-bold">{t('Invitation')}</h1>
          <p role="alert" className="text-red-600 text-sm">
            {t('Invalid invite link: token is missing.')}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `/invite?token=${encodeURIComponent(token)}` }}
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center space-y-2">
        <h1 className="text-2xl font-bold">{t('Invitation')}</h1>
        {errorMessage ? (
          <p role="alert" className="text-red-600 text-sm">
            {errorMessage}
          </p>
        ) : (
          <p className="text-gray-500">{t('Accepting invitation...')}</p>
        )}
      </div>
    </div>
  )
}
