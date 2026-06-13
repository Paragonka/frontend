import { useTranslation } from 'react-i18next'

export function TermsPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">{t('Terms of Use')}</h1>
        <p className="text-sm text-gray-500">{t('Effective date: August 18, 2026')}</p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('1. Acceptance of Terms')}</h2>
          <p>
            {t(
              "By registering or using Paragonka CRM (the 'Service'), you agree to these Terms of Use. If you do not agree with them, please do not use the Service.",
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('2. About the Service')}</h2>
          <p>
            {t(
              'Paragonka CRM is a SaaS service for managing clients, products and orders for small businesses. The Service is provided remotely via the Internet.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('3. Accounts and Registration')}</h2>
          <p>
            {t(
              'To use the Service, you must register. You are responsible for the confidentiality of your credentials and for all actions performed under your account.',
            )}
          </p>
          <p>{t('You must provide accurate registration data and keep it up to date.')}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('4. User Obligations')}</h2>
          <p>
            {t(
              'You agree to use the Service only for lawful purposes, not to violate the rights of third parties, and not to interfere with the operation of the Service.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('5. Data and Privacy')}</h2>
          <p>
            {t(
              'The processing of your data is governed by the Privacy Policy, which is an integral part of these Terms.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('6. Intellectual Property')}</h2>
          <p>
            {t(
              'The Service, its interface and software belong to Paragonka. Using the Service does not grant you any rights to it.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('7. Service Availability')}</h2>
          <p>
            {t(
              'We aim to keep the Service available 24/7, but do not guarantee uninterrupted operation due to technical maintenance or unforeseen circumstances.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('8. Limitation of Liability')}</h2>
          <p>
            {t(
              "The Service is provided 'as is'. To the maximum extent permitted by law, we are not liable for damages arising from the use or inability to use the Service.",
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('9. Suspension and Termination')}</h2>
          <p>
            {t(
              'We may suspend or terminate access to the Service in case of violation of these Terms, unlawful use of the Service, or upon your request.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('10. Changes to the Terms')}</h2>
          <p>
            {t(
              'We may update these Terms. We will notify you of material changes at least 14 days before the new version takes effect by email to the address provided at registration.',
            )}
          </p>
          <p>
            {t(
              'The current version is always available on this page with its effective date. By continuing to use the Service after the effective date, you accept the new version. If you do not agree with the changes, you may stop using the Service and delete your account before the effective date.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('11. Governing Law')}</h2>
          <p>
            {t(
              'These Terms are governed by the law of the European Union. Disputes are subject to the jurisdiction of the courts of Poland.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">{t('12. Contacts')}</h2>
          <p>{t('Questions about the Terms: sovwva7@gmail.com')}</p>
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
