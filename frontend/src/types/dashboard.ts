export interface DashboardMetrics {
  success: boolean
  overview: {
    total_datasets: number
    total_models: number
    total_jobs: number
    deployed_models: number
  }
  average_metrics: {
    mae: number
    rmse: number
    mape: number
    r2: number
  }
  recent_activity: Array<{
    id: string
    model_type: string
    status: string
    created_at: string
  }>
}

export interface PerformanceData {
  success: boolean
  performance: Array<{
    model_id: string
    model_name: string
    model_type: string
    mae: number
    rmse: number
    mape: number
    r2: number
    total_products: number
  }>
  total_models: number
}

export interface TrendsData {
  success: boolean
  trends: Array<{
    type: 'weekly' | 'monthly'
    data: Array<{
      Week?: string
      Month?: string
      TotalQuantity: number
    }>
  }>
  dataset_id?: string
}

export interface AlertsData {
  success: boolean
  alerts: Array<{
    type: 'training_failed' | 'poor_performance' | 'old_models'
    severity: 'high' | 'medium' | 'low'
    message: string
    count?: number
    model_ids?: string[]
  }>
  total_alerts: number
}

export interface SummaryData {
  success: boolean
  summary: {
    total_datasets: number
    total_models: number
    total_jobs: number
    job_status_breakdown: Record<string, number>
    model_type_breakdown: Record<string, number>
    recent_activity_count: number
  }
  recent_activity: Array<{
    id: string
    type: string
    model_type: string
    status: string
    days_ago: number
  }>
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  version?: string
}