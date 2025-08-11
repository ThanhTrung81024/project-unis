import { Link } from 'react-router-dom'
import { Plus, Play, Clock, CheckCircle, XCircle, Eye } from 'lucide-react'
import { Table } from '../../components/Table'
import { StatusBadge } from '../../components/StatusBadge'
import { useTrainingJobs } from '../../hooks/useTraining'
import type { TrainingJob } from '../../types/job'

export const JobsListPage = () => {
  const { data: jobsResponse, isLoading } = useTrainingJobs()

  const jobs = jobsResponse?.jobs || []

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'running':
        return <Play className="h-4 w-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'Job ID',
      render: (job: TrainingJob) => (
        <Link
          to={`/training/jobs/${job.id}`}
          className="font-mono text-sm text-primary-600 hover:text-primary-700"
        >
          {job.id.slice(0, 8)}...
        </Link>
      ),
    },
    {
      key: 'model_type',
      header: 'Model Type',
      sortable: true,
      render: (job: TrainingJob) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
          {job.model_type}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (job: TrainingJob) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(job.status)}
          <StatusBadge status={job.status} />
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (job: TrainingJob) => (
        <div>
          <p className="text-sm text-gray-900">
            {new Date(job.created_at).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(job.created_at).toLocaleTimeString()}
          </p>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (job: TrainingJob) => {
        if (!job.started_at) return '-'
        
        const start = new Date(job.started_at)
        const end = job.completed_at ? new Date(job.completed_at) : new Date()
        const duration = Math.round((end.getTime() - start.getTime()) / 1000)
        
        if (duration < 60) return `${duration}s`
        if (duration < 3600) return `${Math.round(duration / 60)}m`
        return `${Math.round(duration / 3600)}h`
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (job: TrainingJob) => (
        <Link
          to={`/training/jobs/${job.id}`}
          className="text-gray-400 hover:text-gray-600"
          title="View details"
        >
          <Eye className="h-4 w-4" />
        </Link>
      ),
    },
  ]

  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Jobs</h1>
          <p className="text-gray-600">Monitor your ML model training progress</p>
        </div>
        <Link to="/training/start" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Start Training
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-600">{jobs.length}</p>
          <p className="text-sm text-gray-600">Total Jobs</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600">{statusCounts.running || 0}</p>
          <p className="text-sm text-gray-600">Running</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{statusCounts.completed || 0}</p>
          <p className="text-sm text-gray-600">Completed</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600">{statusCounts.failed || 0}</p>
          <p className="text-sm text-gray-600">Failed</p>
        </div>
      </div>

      {/* Table */}
      <Table
        data={jobs}
        columns={columns}
        loading={isLoading}
        emptyMessage="No training jobs found. Start your first training job to get started."
      />
    </div>
  )
}