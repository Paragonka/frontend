import { useTranslation } from 'react-i18next'

export function CookiePage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">{t('Cookie Policy')}</h1>
        <p className="text-sm text-gray-500">{t('Last updated: August 18, 2026')}</p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('1. What are cookies')}</h2>
          <p>
            {t(
              'Cookies are small text files that are saved on your device when you visit a website.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('2. What cookies we use')}</h2>
          <p>
            {t(
              'We only use necessary cookies: access_token (authentication) and lang (language selection). We do not use cookies for tracking or advertising.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('3. Third-party cookies')}</h2>
          <p>{t('We do not use third-party cookies.')}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('4. Consent and management')}</h2>
          <p>
            {t(
              'On your first visit to the Service, you can accept or decline the use of cookies. You can also disable cookies in your browser settings, but this may affect the functionality of the Service.',
            )}
          </p>
          <p>{t('You can learn more about how we process your data in the Privacy Policy.')}</p>
        </section>

        <div className="pt-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="text-blue-600 hover:underline"
          >
            {t('Back')}
          </button>
        </div>
      </div>
    </div>
  )
}
