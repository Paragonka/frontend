import { useTranslation } from 'react-i18next'
import { formatDate } from '@/shared/lib/format'
import {
  useAuthSessions,
  useLogout,
  useRevokeAllSessions,
  useRevokeSession,
} from '../hooks/useAuth'

function truncateUserAgent(userAgent: string | null, max = 40): string {
  if (!userAgent) return '—'
  return userAgent.length > max ? `${userAgent.slice(0, max)}…` : userAgent
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong'
}

export function SessionsSection() {
  const { t } = useTranslation()
  const { data: sessions, isLoading, error: listError } = useAuthSessions()
  const revokeSession = useRevokeSession()
  const revokeAllSessions = useRevokeAllSessions()
  // Signing out of the current session is a plain logout: the backend revokes
  // this device's refresh session and clears cookies.
  const signOut = useLogout()

  if (isLoading) return <div>{t('Loading...')}</div>

  return (
    <div className="space-y-4 max-w-2xl">
      {(listError || revokeSession.error || revokeAllSessions.error) && (
        <p role="alert" className="text-red-600 text-sm">
          {getErrorMessage(listError ?? revokeSession.error ?? revokeAllSessions.error)}
        </p>
      )}

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">{t('IP address')}</th>
              <th className="text-left p-3">{t('Device')}</th>
              <th className="text-left p-3">{t('Created')}</th>
              <th className="text-left p-3">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sessions?.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-3 text-center text-gray-500">
                  {t('No active sessions')}
                </td>
              </tr>
            ) : (
              sessions?.map((session) => (
                <tr
                  key={session.id}
                  data-testid="session-row"
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3">{session.ip ?? '—'}</td>
                  <td className="p-3" title={session.user_agent ?? undefined}>
                    {truncateUserAgent(session.user_agent)}
                  </td>
                  <td className="p-3">
                    {session.created_at ? formatDate(session.created_at) : '—'}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {session.is_current && (
                      <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 mr-2">
                        {t('Current')}
                      </span>
                    )}
                    {session.is_current ? (
                      <button
                        type="button"
                        onClick={() => signOut()}
                        data-testid="sign-out-current"
                        className="text-red-600 hover:underline"
                      >
                        {t('Sign out')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => revokeSession.mutate(session.id)}
                        disabled={revokeSession.isPending}
                        data-testid={`sign-out-${session.id}`}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        {t('Sign out')}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => revokeAllSessions.mutate()}
        disabled={revokeAllSessions.isPending}
        className="border border-red-300 text-red-600 rounded px-4 py-2 hover:bg-red-50 disabled:opacity-50"
      >
        {t('Sign out everywhere')}
      </button>
    </div>
  )
}
