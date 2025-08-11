import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Clock, 
  Play, 
  CheckCircle, 
  XCircle,
  Download,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import { useJobStatus, useJobResult } from '../../hooks/useTraining'

export const JobDetailPage = () => {
  const { jobId } = useParams<{ jobId: string }>()
  
  const { data: statusResponse, isLoading: statusLoading } = useJobStatus(jobId!)
  const { data: resultResponse, isLoading: resultLoading } = useJobResult(
    jobId!,
    statusResponse?.status === 'completed'
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-8 w-8 text-yellow-500" />
      case 'running':
        return <Play className="h-8 w-8 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'failed':
        return <XCircle className="h-8 w-8 text-red-500" />
      default:
        return <Clock className="h-8 w-8 text-gray-500" />
    }
  }

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return '-'
    
    const startTime = new Date(start)
    const endTime = end ? new Date(end) : new Date()
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000)
    
    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.round(duration / 60)}m ${duration % 60}s`
    return `${Math.round(duration / 3600)}h ${Math.round((duration % 3600) / 60)}m`
  }

  if (statusLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="card">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!statusResponse) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Training job not found</p>
        <Link to="/training" className="btn-primary mt-4">
          Back to Training Jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/training"
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Job Details</h1>
          <p className="text-gray-600 font-mono">{jobId}</p>
        </div>
      </div>

      {/* Status Card */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getStatusIcon(statusResponse.status)}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Training Status
              </h2>
              <StatusBadge status={statusResponse.status} className="mt-1" />
            </div>
          </div>
          
          {statusResponse.status === 'running' && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Training in progress...</p>
              <div className="mt-2">
                <div className="animate-pulse-slow h-2 bg-blue-200 rounded-full">
                  <div className="h-2 bg-blue-600 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Job ID</dt>
              <dd className="text-sm text-gray-900 font-mono">{statusResponse.job_id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm text-gray-900">
                <StatusBadge status={statusResponse.status} />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="text-sm text-gray-900">
                {new Date(statusResponse.created_at).toLocaleString()}
              </dd>
            </div>
            {statusResponse.started_at && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Started</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(statusResponse.started_at).toLocaleString()}
                </dd>
              </div>
            )}
            {statusResponse.completed_at && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Completed</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(statusResponse.completed_at).toLocaleString()}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Duration</dt>
              <dd className="text-sm text-gray-900">
                {formatDuration(statusResponse.started_at, statusResponse.completed_at)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Error Information */}
        {statusResponse.status === 'failed' && statusResponse.error && (
          <div className="card border-red-200 bg-red-50">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-red-900 mb-2">Error Details</h2>
                <p className="text-sm text-red-800 bg-red-100 p-3 rounded-md font-mono">
                  {statusResponse.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Training Results */}
        {statusResponse.status === 'completed' && resultResponse && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Training Results</h2>
            {resultLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-600">MAE</p>
                    <p className="text-lg font-bold text-blue-900">
                      {resultResponse.metrics.mae?.toFixed(4) || 'N/A'}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-600">RMSE</p>
                    <p className="text-lg font-bold text-green-900">
                      {resultResponse.metrics.rmse?.toFixed(4) || 'N/A'}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-600">MAPE</p>
                    <p className="text-lg font-bold text-yellow-900">
                      {resultResponse.metrics.mape?.toFixed(2) || 'N/A'}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-600">R²</p>
                    <p className="text-lg font-bold text-purple-900">
                      {resultResponse.metrics.r2?.toFixed(4) || 'N/A'}
                    </p>
                  </div>
                </div>

                {(resultResponse.results_file || resultResponse.plot_file) && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Downloads</h3>
                    <div className="flex space-x-2">
                      {resultResponse.results_file && (
                        <button className="btn-outline text-xs">
                          <Download className="h-3 w-3 mr-1" />
                          Results
                        </button>
                      )}
                      {resultResponse.plot_file && (
                        <button className="btn-outline text-xs">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Plot
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auto-refresh notice for running jobs */}
      {statusResponse.status === 'running' && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="spinner" />
            <p className="text-blue-800 text-sm">
              This page will automatically update every 2 seconds while training is in progress.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}