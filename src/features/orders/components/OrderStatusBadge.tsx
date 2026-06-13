import { memo } from 'react'
import { useTranslation } from 'react-i18next'

interface OrderStatusBadgeProps {
  status: 'draft' | 'confirmed' | 'done' | 'cancelled'
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  done: 'Done',
  cancelled: 'Cancelled',
}

export const OrderStatusBadge = memo(function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const { t } = useTranslation()

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] ?? 'bg-gray-100 text-gray-800'}`}
    >
      {t(statusLabels[status] ?? status)}
    </span>
  )
})
