import { api } from '../lib/axios'
import type {
  DashboardMetrics,
  PerformanceData,
  TrendsData,
  AlertsData,
  SummaryData,
  HealthStatus,
} from '../types/dashboard'

export const dashboardApi = {
  // Get dashboard metrics
  getMetrics: async (): Promise<DashboardMetrics> => {
    const response = await api.get('/dashboard/metrics')
    return response.data
  },

  // Get performance data
  getPerformance: async (): Promise<PerformanceData> => {
    const response = await api.get('/dashboard/performance')
    return response.data
  },

  // Get trends data
  getTrends: async (): Promise<TrendsData> => {
    const response = await api.get('/dashboard/trends')
    return response.data
  },

  // Get alerts
  getAlerts: async (): Promise<AlertsData> => {
    const response = await api.get('/dashboard/alerts')
    return response.data
  },

  // Get summary
  getSummary: async (): Promise<SummaryData> => {
    const response = await api.get('/dashboard/summary')
    return response.data
  },

  // Health check
  getHealth: async (): Promise<HealthStatus> => {
    const response = await api.get('/health')
    return response.data
  },
}