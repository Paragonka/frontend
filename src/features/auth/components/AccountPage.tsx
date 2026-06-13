import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useAuthStore } from '@/shared/store/auth'
import { ChangePasswordSection } from './ChangePasswordSection'
import { SessionsSection } from './SessionsSection'

type AccountTab = 'password' | 'sessions'

export function AccountPage() {
  const { t } = useTranslation()
  const currentOrgId = useAuthStore((s) => s.currentOrgId)
  const [tab, setTab] = useState<AccountTab>('password')

  const homeTo = currentOrgId ? `/app/${currentOrgId}` : '/orgs/select'

  const tabs: Array<{ id: AccountTab; label: string }> = [
    { id: 'password', label: t('Change password') },
    { id: 'sessions', label: t('Sessions') },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <Link
        to={homeTo}
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('Back')}
      </Link>

      <h1 className="text-xl sm:text-2xl font-bold mb-4">{t('Account settings')}</h1>

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

      {tab === 'password' && <ChangePasswordSection />}
      {tab === 'sessions' && <SessionsSection />}
    </div>
  )
}
