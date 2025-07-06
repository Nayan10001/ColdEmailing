import { getStatusColor, getStatusIcon } from '../lib/utils'
import { cn } from '../lib/utils'

interface StatusBadgeProps {
  status: string
  showIcon?: boolean
  className?: string
}

export default function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  return (
    <span className={cn('badge', getStatusColor(status), className)}>
      {showIcon && <span className="mr-1">{getStatusIcon(status)}</span>}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}