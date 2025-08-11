import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Download, 
  Edit, 
  Trash2, 
  Calendar,
  Database,
  BarChart3,
  FileText,
  Tag
} from 'lucide-react'
import { useDataset, useDeleteDataset, useDatasetVisualization } from '../../hooks/useDatasets'
import { datasetsApi } from '../../api/datasets'
import { toast } from 'sonner'

export const DatasetDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'visualization'>('overview')
  
  const { data: datasetResponse, isLoading } = useDataset(id!)
  const { data: visualizationBlob, isLoading: visualizationLoading, error: visualizationError } = useDatasetVisualization(id!)
  const deleteDataset = useDeleteDataset()

  const dataset = datasetResponse?.dataset

  const handleDownload = async () => {
    if (!dataset) return
    
    try {
      const blob = await datasetsApi.download(dataset.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = dataset.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Dataset downloaded successfully')
    } catch (error) {
      toast.error('Failed to download dataset')
    }
  }

  const handleDelete = () => {
    if (!dataset) return
    
    if (window.confirm(`Are you sure you want to delete "${dataset.name}"?`)) {
      deleteDataset.mutate(dataset.id, {
        onSuccess: () => {
          navigate('/datasets')
        }
      })
    }
  }

  if (isLoading) {
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

  if (!dataset) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Dataset not found</p>
        <Link to="/datasets" className="btn-primary mt-4">
          Back to Datasets
        </Link>
      </div>
    )
  }

  const visualizationUrl = visualizationBlob ? URL.createObjectURL(visualizationBlob) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/datasets"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{dataset.name}</h1>
            <p className="text-gray-600">{dataset.filename}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownload}
            className="btn-outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </button>
          <button
            onClick={handleDelete}
            className="btn-danger"
            disabled={deleteDataset.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 mr-2 inline" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('visualization')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'visualization'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-2 inline" />
            Visualization
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dataset Information</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">{dataset.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Filename</dt>
                  <dd className="text-sm text-gray-900">{dataset.filename}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Uploaded</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(dataset.uploaded_at).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="text-sm text-gray-900">
                    {dataset.description || 'No description provided'}
                  </dd>
                </div>
              </dl>
              
              {dataset.tags && dataset.tags.length > 0 && (
                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500 mb-2">Tags</dt>
                  <div className="flex flex-wrap gap-2">
                    {dataset.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Date Range</h2>
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Start Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(dataset.stats.date_range.start).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">End Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(dataset.stats.date_range.end).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">Products</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {dataset.stats.total_products.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Weeks</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {dataset.stats.total_weeks.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="text-sm text-gray-600">Records</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {dataset.stats.total_records.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-2">
                <Link
                  to={`/training/start?dataset=${dataset.id}`}
                  className="btn-primary w-full justify-center"
                >
                  Start Training
                </Link>
                <button
                  onClick={handleDownload}
                  className="btn-outline w-full justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Dataset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'visualization' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Visualization</h2>
          {visualizationLoading ? (
            <div className="h-96 bg-gray-200 rounded animate-pulse" />
          ) : visualizationError ? (
            <div className="h-96 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No visualization available for this dataset</p>
              </div>
            </div>
          ) : visualizationUrl ? (
            <div className="text-center">
              <img
                src={visualizationUrl}
                alt="Dataset Visualization"
                className="max-w-full h-auto rounded-lg shadow-sm"
              />
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Loading visualization...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}