import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LANGUAGES } from '@/shared/constants'
import { useLanguage } from '@/shared/i18n/use-language'
import { useAuthStore } from '@/shared/store/auth'
import { Logo } from '@/shared/ui/Logo'

const features = [
  {
    key: 'Keep a client database with order history and notes',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <title>Clients</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    key: 'Create orders with custom items',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <title>Orders</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    key: 'Revenue and expense analytics with beautiful charts',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <title>Analytics</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
]

export function LandingPage() {
  const { t } = useTranslation()
  const { currentLang, setLanguage } = useLanguage()
  const user = useAuthStore((s) => s.user)
  const currentOrgId = useAuthStore((s) => s.currentOrgId)

  const appTarget = user ? (currentOrgId ? `/app/${currentOrgId}` : '/orgs/select') : null
  const appTargetLabel = currentOrgId ? t('Organization dashboard') : t('Go to organizations')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-3 sm:gap-4">
          <select
            value={currentLang}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-sm border rounded px-2 py-1 bg-white"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
          {appTarget ? (
            <Link
              to={appTarget}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              {appTargetLabel}
            </Link>
          ) : (
            <Link to="/login" className="text-sm text-gray-700 hover:text-gray-900 font-medium">
              {t('Log in')}
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 px-4 text-center">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-3">
            {t('CRM for small business')}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            {t('Paragonka CRM')}
          </h1>
          <p className="max-w-xl mx-auto text-lg text-gray-600 mb-8">
            {t('Modern CRM for your business. Manage clients, orders and finances in one place.')}
          </p>
          <div className="flex justify-center gap-3">
            {appTarget ? (
              <Link
                to={appTarget}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {appTargetLabel}
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {t('Get started')}
                </Link>
                <Link
                  to="/login"
                  className="bg-white text-gray-700 border px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  {t('Log in')}
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.key}
                className="bg-white border rounded-lg p-6 flex flex-col items-start gap-3"
              >
                <div className="text-blue-600">{feature.icon}</div>
                <p className="font-medium text-gray-900">{t(feature.key)}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 Paragonka CRM</p>
          <div className="flex gap-4 text-sm">
            <Link to="/privacy" className="text-gray-600 hover:text-gray-900">
              {t('Privacy Policy')}
            </Link>
            <Link to="/terms" className="text-gray-600 hover:text-gray-900">
              {t('Terms of Use')}
            </Link>
            <Link to="/cookie" className="text-gray-600 hover:text-gray-900">
              {t('Cookie Policy')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
