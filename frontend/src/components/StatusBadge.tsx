import { clsx } from 'clsx'

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusConfig = {
  // Training job statuses
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  running: { color: 'bg-blue-100 text-blue-800', label: 'Running' },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
  failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
  
  // Model statuses
  ready: { color: 'bg-gray-100 text-gray-800', label: 'Ready' },
  deployed: { color: 'bg-green-100 text-green-800', label: 'Deployed' },
  training: { color: 'bg-blue-100 text-blue-800', label: 'Training' },
  
  // Health statuses
  healthy: { color: 'bg-green-100 text-green-800', label: 'Healthy' },
  unhealthy: { color: 'bg-red-100 text-red-800', label: 'Unhealthy' },
  
  // Alert severities
  high: { color: 'bg-red-100 text-red-800', label: 'High' },
  medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
  low: { color: 'bg-blue-100 text-blue-800', label: 'Low' },
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    color: 'bg-gray-100 text-gray-800',
    label: status,
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  )
}