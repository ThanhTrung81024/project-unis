import { Activity, AlertCircle, CheckCircle } from 'lucide-react'
import { useHealthStatus } from '../hooks/useDashboard'

export const Navbar = () => {
  const { data: health, isLoading: healthLoading } = useHealthStatus()

  const getHealthStatus = () => {
    if (healthLoading) {
      return { icon: Activity, color: 'text-yellow-500', text: 'Checking...' }
    }
    
    if (health?.status === 'healthy') {
      return { icon: CheckCircle, color: 'text-green-500', text: 'Healthy' }
    }
    
    return { icon: AlertCircle, color: 'text-red-500', text: 'Unhealthy' }
  }

  const { icon: HealthIcon, color, text } = getHealthStatus()

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">Unis Forecast</h1>
          <span className="text-sm text-gray-500">ML Demand Forecasting</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <HealthIcon className={`h-4 w-4 ${color}`} />
          <span className={`text-sm font-medium ${color}`}>{text}</span>
        </div>
      </div>
    </nav>
  )
}