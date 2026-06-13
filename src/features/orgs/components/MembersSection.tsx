import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/shared/store/auth'
import { useOrgMembers, useRemoveMember } from '../hooks/useOrgs'

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong'
}

interface MembersSectionProps {
  orgId: string
}

export function MembersSection({ orgId }: MembersSectionProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data: members, isLoading } = useOrgMembers(orgId)
  const removeMember = useRemoveMember(orgId)

  if (isLoading) return <div>{t('Loading...')}</div>

  return (
    <div>
      {removeMember.error && (
        <p role="alert" className="text-red-600 text-sm mb-3">
          {getErrorMessage(removeMember.error)}
        </p>
      )}

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">{t('Email')}</th>
              <th className="text-left p-3">{t('Name')}</th>
              <th className="text-left p-3">{t('Role')}</th>
              <th className="text-left p-3">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {members?.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-3 text-center text-gray-500">
                  {t('No members yet')}
                </td>
              </tr>
            ) : (
              members?.map((member) => (
                <tr
                  key={member.user_id}
                  data-testid="member-row"
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3">{member.email}</td>
                  <td className="p-3">{member.full_name}</td>
                  <td className="p-3">
                    <span
                      className={
                        member.role === 'owner'
                          ? 'inline-block rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800'
                          : 'inline-block rounded px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600'
                      }
                    >
                      {member.role === 'owner' ? t('Owner') : t('Member')}
                    </span>
                  </td>
                  <td className="p-3">
                    {user && member.user_id !== user.id && (
                      <button
                        type="button"
                        onClick={() => removeMember.mutate(member.user_id)}
                        disabled={removeMember.isPending}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        {t('Remove')}
                      </button>
                    )}
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
