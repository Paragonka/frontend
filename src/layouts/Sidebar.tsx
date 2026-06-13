import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useAuthStore } from '@/shared/store/auth'

const navItems = [
  { to: 'orders/calendar', label: 'Calendar', icon: '📅' },
  { to: 'orders', label: 'Orders', icon: '📋', end: true },
  { to: 'clients', label: 'Clients', icon: '👥' },
  { to: 'products', label: 'Products', icon: '📦' },
  { to: 'eav', label: 'Fields (EAV)', icon: '🏷️' },
  { to: 'receipts', label: 'Receipts', icon: '🧾' },
  { to: 'finances', label: 'Finances', icon: '💰' },
  { to: 'settings', label: 'Settings', icon: '⚙️' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar = memo(function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const orgId = useAuthStore((s) => s.currentOrgId)

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile: fixed overlay sidebar. Desktop: static always-visible sidebar */}
      <aside
        className={cn(
          'bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] transition-all duration-200 overflow-hidden',
          'fixed top-16 left-0 z-30',
          // Mobile: toggle width
          isOpen ? 'w-64' : 'w-0',
          // Desktop: always visible, static position
          'lg:static lg:top-auto lg:w-64',
        )}
      >
        <div className="w-64 p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={`/app/${orgId}/${item.to}`}
                end={'end' in item ? item.end : undefined}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100',
                  )
                }
              >
                <span>{item.icon}</span>
                {t(item.label)}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
})
