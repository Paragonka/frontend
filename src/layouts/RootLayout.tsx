import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useOrgs } from '@/features/orgs/hooks/useOrgs'
import { useAuthStore } from '@/shared/store/auth'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export function RootLayout() {
  const { t } = useTranslation()
  const { orgId } = useParams<{ orgId: string }>()
  const user = useAuthStore((s) => s.user)
  const currentOrgId = useAuthStore((s) => s.currentOrgId)
  const setCurrentOrg = useAuthStore((s) => s.setCurrentOrg)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const onToggleSidebar = useCallback(() => setSidebarOpen((v) => !v), [])
  const onCloseSidebar = useCallback(() => setSidebarOpen(false), [])
  const { data: orgs, isLoading: orgsLoading } = useOrgs()

  // Keep the persisted store in sync with :orgId from the URL so that hooks
  // reading currentOrgId never diverge from the address bar.
  useEffect(() => {
    if (orgId && orgId !== currentOrgId) {
      setCurrentOrg(orgId)
    }
  }, [orgId, currentOrgId, setCurrentOrg])

  if (!user) return <Navigate to="/login" replace />
  if (!currentOrgId && !orgId) return <Navigate to="/orgs/select" replace />

  // Validate that the orgId from the URL belongs to the user's organizations.
  // If the org list has loaded and the org is not found -> redirect to selection.
  if (orgId && orgs && !orgs.some((o) => o.id === orgId)) {
    return <Navigate to="/orgs/select" replace />
  }

  // Show a minimal loading state while verifying org access.
  if (orgId && orgsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-500">{t('Loading...')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onToggleSidebar={onToggleSidebar} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={onCloseSidebar} />
        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
