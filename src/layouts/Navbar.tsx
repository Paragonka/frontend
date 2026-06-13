import { memo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLogout } from '@/features/auth'
import { useOrgs } from '@/features/orgs/hooks/useOrgs'
import { LANGUAGES } from '@/shared/constants'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { useLanguage } from '@/shared/i18n/use-language'
import { useAuthStore } from '@/shared/store/auth'
import { Logo } from '@/shared/ui/Logo'

interface NavbarProps {
  onToggleSidebar: () => void
}

export const Navbar = memo(function Navbar({ onToggleSidebar }: NavbarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const currentOrgId = useAuthStore((s) => s.currentOrgId)
  const { data: orgs } = useOrgs()
  const currentOrg = orgs?.find((o) => o.id === currentOrgId)
  const { currentLang, setLanguage } = useLanguage()
  const logout = useLogout()
  const isOnline = useOnlineStatus()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 relative z-40">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>{t('Toggle sidebar')}</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <Logo />
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'}`}
          title={isOnline ? 'Online' : 'Offline'}
        />

        {currentOrg && (
          <button
            type="button"
            onClick={() => navigate('/orgs/select')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-sm text-gray-700"
            title={t('Switch organization')}
          >
            <svg
              className="w-4 h-4 text-gray-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>{t('Switch organization')}</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span className="hidden sm:inline truncate max-w-[140px]">{currentOrg.name}</span>
          </button>
        )}

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            <span className="hidden sm:inline text-gray-700">{user?.full_name}</span>
            <span className="inline sm:hidden text-gray-700">
              {user?.full_name.split(' ')[0] ?? user?.full_name}
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>{t('Profile')}</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {profileOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                onClick={() => setProfileOpen(false)}
                tabIndex={-1}
                aria-label="Close"
              />
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg border shadow-lg z-20 py-1">
                <div className="px-3 py-2 border-b text-sm text-gray-500">
                  {user?.full_name}
                  <br />
                  <span className="text-xs">{user?.email}</span>
                </div>

                <div className="px-3 py-2 border-b">
                  <span className="text-xs text-gray-500 mb-1 block">{t('Language')}</span>
                  <select
                    value={currentLang}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full text-sm border rounded px-2 py-1"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/account')
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('Account settings')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    logout()
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                >
                  {t('Log out')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
})
