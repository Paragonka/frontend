import { useTranslation } from 'react-i18next'

export function PrivacyPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">{t('Privacy Policy')}</h1>
        <p className="text-sm text-gray-500">{t('Last updated: August 18, 2026')}</p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('1. What data we collect')}</h2>
          <p>
            {t(
              'We collect only the data required to operate the CRM: first name, last name, email, phone, as well as client, product and order records that you create while using the Service.',
            )}
          </p>
          <p>{t('We do not collect payment card data or other sensitive information.')}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('2. How we use the data')}</h2>
          <p>
            {t(
              'The data is used solely to provide the Service: authentication, management of clients, products and orders, and analytics. We do not sell data and do not share it with third parties.',
            )}
          </p>
          <p>{t('We do not use your data for advertising.')}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('3. Data storage and security')}</h2>
          <p>{t('All data is stored on servers located in the European Union.')}</p>
          <p>
            {t(
              'Data is protected: passwords are stored in hashed form, access to the account requires authentication, and backups are created regularly.',
            )}
          </p>
          <p>{t('Data is not transferred outside the European Union.')}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('4. Data retention')}</h2>
          <p>
            {t(
              'We keep your data while your account is active. After you delete your account or request data deletion, the data is fully removed, including from backups, within 90 days.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('5. Your rights')}</h2>
          <p>
            {t(
              'You can request access to your data, its correction, export or deletion at any time. To exercise these rights, contact us using the details in section 8.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('6. Cookies')}</h2>
          <p>
            {t(
              'We use only necessary cookies for authentication and language selection. More details can be found in the Cookie Policy.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('7. Changes to the Privacy Policy')}</h2>
          <p>
            {t(
              'We may update this Privacy Policy. We will notify you of material changes to the purposes, scope or legal bases of processing at least 14 days in advance by email to the address provided at registration.',
            )}
          </p>
          <p>
            {t(
              'The current version is always available on this page with its update date. By continuing to use the Service after the changes take effect, you agree to the new version.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('8. Contacts')}</h2>
          <p>{t('Privacy inquiries: sovwva7@gmail.com')}</p>
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
