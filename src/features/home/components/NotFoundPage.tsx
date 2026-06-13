import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-4">
        <p className="text-7xl font-bold text-gray-300">404</p>
        <h1 className="text-2xl font-bold text-gray-900">{t('Page not found')}</h1>
        <p className="text-gray-600">{t('The page you are looking for does not exist.')}</p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {t('Home')}
          </Link>
        </div>
      </div>
    </div>
  )
}
