import { 
  Database, 
  Brain, 
  Settings, 
  TrendingUp,
  AlertTriangle,
  Activity,
  Users,
  BarChart3
} from 'lucide-react'
import { Chart } from '../../components/Chart'
import { StatusBadge } from '../../components/StatusBadge'
import { 
  useDashboardMetrics, 
  usePerformanceData, 
  useTrendsData, 
  useAlertsData 
} from '../../hooks/useDashboard'

export const DashboardPage = () => {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: performance, isLoading: performanceLoading } = usePerformanceData()
  const { data: trends, isLoading: trendsLoading } = useTrendsData()
  const { data: alerts, isLoading: alertsLoading } = useAlertsData()

  const summaryCards = [
    {
      title: 'Total Datasets',
      value: metrics?.overview.total_datasets || 0,
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Models',
      value: metrics?.overview.total_models || 0,
      icon: Brain,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Training Jobs',
      value: metrics?.overview.total_jobs || 0,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Deployed Models',
      value: metrics?.overview.deployed_models || 0,
      icon: Settings,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  const metricsCards = [
    {
      title: 'Average MAE',
      value: metrics?.average_metrics.mae?.toFixed(4) || '0.0000',
      description: 'Mean Absolute Error',
    },
    {
      title: 'Average RMSE',
      value: metrics?.average_metrics.rmse?.toFixed(4) || '0.0000',
      description: 'Root Mean Square Error',
    },
    {
      title: 'Average MAPE',
      value: `${metrics?.average_metrics.mape?.toFixed(2) || '0.00'}%`,
      description: 'Mean Absolute Percentage Error',
    },
    {
      title: 'Average R²',
      value: metrics?.average_metrics.r2?.toFixed(4) || '0.0000',
      description: 'R-squared Score',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your ML forecasting system</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card) => (
          <div key={card.title} className="card">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metricsLoading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    card.value
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsCards.map((card) => (
          <div key={card.title} className="card text-center">
            <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
            <p className="text-3xl font-bold text-primary-600 mt-2">
              {metricsLoading ? (
                <div className="h-9 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
              ) : (
                card.value
              )}
            </p>
            <p className="text-sm text-gray-500 mt-1">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Model Performance</h2>
          {performanceLoading ? (
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          ) : performance?.performance && performance.performance.length > 0 ? (
            <Chart
              data={performance.performance}
              type="bar"
              xKey="model_name"
              yKey="mape"
              height={250}
              color="#ef4444"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No performance data available
            </div>
          )}
        </div>

        {/* Trends Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Demand Trends</h2>
          {trendsLoading ? (
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          ) : trends?.trends && trends.trends.length > 0 ? (
            <Chart
              data={trends.trends[0]?.data || []}
              type="line"
              xKey="Week"
              yKey="TotalQuantity"
              height={250}
              color="#3b82f6"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No trends data available
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {metricsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : metrics?.recent_activity && metrics.recent_activity.length > 0 ? (
            <div className="space-y-3">
              {metrics.recent_activity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.model_type} Training
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={activity.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>

        {/* Alerts */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h2>
          {alertsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : alerts?.alerts && alerts.alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.alerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                    alert.severity === 'high' ? 'text-red-500' :
                    alert.severity === 'medium' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {alert.message}
                      </p>
                      <StatusBadge status={alert.severity} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-500">No alerts - system is healthy</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}