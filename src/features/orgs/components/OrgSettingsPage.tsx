import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useAuthStore } from '@/shared/store/auth'
import { useOrgMembers } from '../hooks/useOrgs'
import { CurrencySection } from './CurrencySection'
import { DangerZone } from './DangerZone'
import { InvitesSection } from './InvitesSection'
import { MembersSection } from './MembersSection'
import { OrgNameSection } from './OrgNameSection'

type SettingsTab = 'general' | 'members' | 'invites'

export function OrgSettingsPage() {
  const { t } = useTranslation()
  const { orgId = '' } = useParams()
  const [tab, setTab] = useState<SettingsTab>('general')
  const user = useAuthStore((s) => s.user)
  const { data: members } = useOrgMembers(orgId)

  const selfRole = members?.find((m) => m.user_id === user?.id)?.role
  const isOwner = selfRole === 'owner'

  const tabs: Array<{ id: SettingsTab; label: string }> = [
    { id: 'general', label: t('General') },
    { id: 'members', label: t('Members') },
    { id: 'invites', label: t('Invitations') },
  ]

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4">{t('Settings')}</h1>

      <div className="flex gap-1 border-b mb-4" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
              tab === item.id
                ? 'bg-white border border-b-white border-gray-200 text-blue-700 -mb-px'
                : 'text-gray-600 hover:bg-gray-100',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="space-y-4">
          <OrgNameSection orgId={orgId} />
          <CurrencySection orgId={orgId} />
          {isOwner && <DangerZone orgId={orgId} />}
        </div>
      )}
      {tab === 'members' && <MembersSection orgId={orgId} />}
      {tab === 'invites' &&
        (isOwner ? (
          <InvitesSection orgId={orgId} />
        ) : (
          <p className="text-gray-500">{t('Only organization owners can manage invitations.')}</p>
        ))}
    </div>
  )
}
