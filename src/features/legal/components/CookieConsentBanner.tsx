import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cookieConsent } from '@/features/legal/api'
import { useAuthStore } from '@/shared/store/auth'

const STORAGE_KEY = 'paragonka-cookie-consent'
const COOKIE_NAME = 'cookie_consent'

export function CookieConsentBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved =
      localStorage.getItem(STORAGE_KEY) || document.cookie.includes(`${COOKIE_NAME}=accepted`)
    if (!saved) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const handleAccept = async () => {
    setLoading(true)
    const user = useAuthStore.getState().user
    if (user) {
      try {
        await cookieConsent()
      } catch {
        // proceed even if the API call fails
      }
    }
    localStorage.setItem(STORAGE_KEY, 'true')
    // biome-ignore lint/suspicious/noDocumentCookie: consent must survive across sessions
    document.cookie = `${COOKIE_NAME}=accepted;path=/;max-age=31536000`
    setVisible(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <p className="text-sm text-gray-700">
          {t('This website uses cookies for authentication and language selection.')}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <a href="/cookie" className="text-sm text-blue-600 hover:underline">
            {t('Learn more')}
          </a>
          <button
            type="button"
            onClick={handleAccept}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t('Loading...') : t('Accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
