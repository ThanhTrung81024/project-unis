import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard'

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: dashboardApi.getMetrics,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export const usePerformanceData = () => {
  return useQuery({
    queryKey: ['dashboard', 'performance'],
    queryFn: dashboardApi.getPerformance,
    refetchInterval: 60000, // Refresh every minute
  })
}

export const useTrendsData = () => {
  return useQuery({
    queryKey: ['dashboard', 'trends'],
    queryFn: dashboardApi.getTrends,
    refetchInterval: 60000, // Refresh every minute
  })
}

export const useAlertsData = () => {
  return useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: dashboardApi.getAlerts,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export const useSummaryData = () => {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.getSummary,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export const useHealthStatus = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: dashboardApi.getHealth,
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 1,
  })
}