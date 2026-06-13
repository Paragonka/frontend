import { memo } from 'react'
import { Link } from 'react-router-dom'
import logoSvg from '@/assets/ok_logo.svg'
import { useAuthStore } from '@/shared/store/auth'

interface LogoProps {
  className?: string
}

export const Logo = memo(function Logo({ className }: LogoProps) {
  const user = useAuthStore((s) => s.user)
  const currentOrgId = useAuthStore((s) => s.currentOrgId)
  const to = user ? (currentOrgId ? `/app/${currentOrgId}` : '/orgs/select') : '/'

  return (
    <Link to={to} className={`flex items-center gap-3 ${className ?? ''}`}>
      <img src={logoSvg} alt="Paragonka CRM" className="h-9 w-auto" />
      <span className="text-xl font-bold text-gray-900 hidden sm:inline">Paragonka CRM</span>
    </Link>
  )
})
