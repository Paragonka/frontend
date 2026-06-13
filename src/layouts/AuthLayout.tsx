import { Navigate, Outlet } from 'react-router-dom'
import { LANGUAGES } from '@/shared/constants'
import { useLanguage } from '@/shared/i18n/use-language'
import { useAuthStore } from '@/shared/store/auth'
import { Logo } from '@/shared/ui/Logo'

export function AuthLayout() {
  const user = useAuthStore((s) => s.user)
  const { currentLang, setLanguage } = useLanguage()

  if (user) {
    return <Navigate to="/orgs/select" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="fixed top-4 right-4">
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
      </div>
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Outlet />
      </div>
    </div>
  )
}
