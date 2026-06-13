import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/shared/lib/format'
import { useOrgInvites, useRevokeInvite } from '../hooks/useOrgs'

interface InvitesListProps {
  orgId: string
}

export function inviteLink(token: string): string {
  return `${window.location.origin}/invite?token=${encodeURIComponent(token)}`
}

export function InvitesList({ orgId }: InvitesListProps) {
  const { t } = useTranslation()
  const { data: invites, isLoading } = useOrgInvites(orgId)
  const revokeInvite = useRevokeInvite(orgId)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!copiedId) return
    const timer = window.setTimeout(() => setCopiedId(null), 2000)
    return () => window.clearTimeout(timer)
  }, [copiedId])

  async function copyLink(inviteId: string, token: string) {
    try {
      await navigator.clipboard.writeText(inviteLink(token))
      setCopiedId(inviteId)
    } catch {
      // clipboard unavailable (permissions/insecure context) - keep silent
    }
  }

  if (isLoading) return <div>{t('Loading...')}</div>

  return (
    <div>
      {revokeInvite.error && (
        <p role="alert" className="text-red-600 text-sm mb-3">
          {revokeInvite.error instanceof Error
            ? revokeInvite.error.message
            : t('Something went wrong')}
        </p>
      )}

      <h3 className="text-md font-semibold mb-2">{t('Active invitations')}</h3>
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">{t('Email')}</th>
              <th className="text-left p-3">{t('Expires')}</th>
              <th className="text-left p-3">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {invites?.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-3 text-center text-gray-500">
                  {t('No pending invitations')}
                </td>
              </tr>
            ) : (
              invites?.map((invite) => (
                <tr
                  key={invite.invite_id}
                  data-testid="invite-row"
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3">{invite.email}</td>
                  <td className="p-3 text-gray-500">
                    {invite.expires_at ? formatDate(invite.expires_at) : '—'}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => copyLink(invite.invite_id, invite.token)}
                        className="text-blue-600 hover:underline"
                      >
                        {copiedId === invite.invite_id ? t('Copied!') : t('Copy link')}
                      </button>
                      <button
                        type="button"
                        onClick={() => revokeInvite.mutate(invite.invite_id)}
                        disabled={revokeInvite.isPending}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        {t('Revoke')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
