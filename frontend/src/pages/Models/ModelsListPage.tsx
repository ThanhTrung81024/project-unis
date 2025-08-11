import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Eye, 
  Play, 
  Download, 
  Trash2, 
  Search,
  Filter,
  Brain,
  Settings,
  TrendingUp
} from 'lucide-react'
import { Table } from '../../components/Table'
import { StatusBadge } from '../../components/StatusBadge'
import { useModels, useDeleteModel, useDeployModel } from '../../hooks/useModels'
import { modelsApi } from '../../api/models'
import { toast } from 'sonner'
import type { Model } from '../../types/model'

export const ModelsListPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  
  const { data: modelsResponse, isLoading } = useModels()
  const deleteModel = useDeleteModel()
  const deployModel = useDeployModel()

  const models = modelsResponse?.models || []

  const filteredModels = models.filter((model) => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || model.status === statusFilter
    const matchesType = !typeFilter || model.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const handleDownload = async (model: Model) => {
    try {
      const blob = await modelsApi.download(model.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `model_${model.id}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Model downloaded successfully')
    } catch (error) {
      toast.error('Failed to download model')
    }
  }

  const handleDeploy = (model: Model) => {
    if (window.confirm(`Deploy model "${model.name}"?`)) {
      deployModel.mutate(model.id)
    }
  }

  const handleDelete = (model: Model) => {
    if (window.confirm(`Are you sure you want to delete "${model.name}"?`)) {
      deleteModel.mutate(model.id)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Model',
      sortable: true,
      render: (model: Model) => (
        <div>
          <Link
            to={`/models/${model.id}`}
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            {model.name}
          </Link>
          <p className="text-xs text-gray-500 capitalize">{model.type}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (model: Model) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
          {model.type}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (model: Model) => <StatusBadge status={model.status} />,
    },
    {
      key: 'metrics.mape',
      header: 'MAPE',
      sortable: true,
      render: (model: Model) => (
        <span className={`font-medium ${
          model.metrics?.mape ? 
            model.metrics.mape < 20 ? 'text-green-600' :
            model.metrics.mape < 50 ? 'text-yellow-600' :
            'text-red-600'
          : 'text-gray-400'
        }`}>
          {model.metrics?.mape ? `${model.metrics.mape.toFixed(2)}%` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'metrics.r2',
      header: 'R²',
      sortable: true,
      render: (model: Model) => (
        <span className={`font-medium ${
          model.metrics?.r2 ? 
            model.metrics.r2 > 0.8 ? 'text-green-600' :
            model.metrics.r2 > 0.5 ? 'text-yellow-600' :
            'text-red-600'
          : 'text-gray-400'
        }`}>
          {model.metrics?.r2 ? model.metrics.r2.toFixed(4) : 'N/A'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (model: Model) => new Date(model.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (model: Model) => (
        <div className="flex items-center space-x-2">
          <Link
            to={`/models/${model.id}`}
            className="text-gray-400 hover:text-gray-600"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {model.status === 'ready' && (
            <button
              onClick={() => handleDeploy(model)}
              className="text-gray-400 hover:text-green-600"
              title="Deploy model"
              disabled={deployModel.isPending}
            >
              <Play className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handleDownload(model)}
            className="text-gray-400 hover:text-gray-600"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(model)}
            className="text-gray-400 hover:text-red-600"
            title="Delete"
            disabled={deleteModel.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const statusCounts = models.reduce((acc, model) => {
    acc[model.status] = (acc[model.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const typeCounts = models.reduce((acc, model) => {
    acc[model.type] = (acc[model.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Models</h1>
          <p className="text-gray-600">Manage your trained ML models</p>
        </div>
        <Link to="/training/start" className="btn-primary">
          <Brain className="h-4 w-4 mr-2" />
          Train New Model
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Statuses</option>
          <option value="ready">Ready</option>
          <option value="deployed">Deployed</option>
          <option value="training">Training</option>
          <option value="failed">Failed</option>
        </select>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Types</option>
          <option value="xgboost">XGBoost</option>
          <option value="prophet">Prophet</option>
          <option value="lightgbm">LightGBM</option>
          <option value="lstm">LSTM</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <Settings className="h-5 w-5 text-gray-600 mr-2" />
            <p className="text-2xl font-bold text-gray-600">{models.length}</p>
          </div>
          <p className="text-sm text-gray-600">Total Models</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <Play className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-2xl font-bold text-green-600">{statusCounts.deployed || 0}</p>
          </div>
          <p className="text-sm text-gray-600">Deployed</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <Brain className="h-5 w-5 text-blue-600 mr-2" />
            <p className="text-2xl font-bold text-blue-600">{typeCounts.xgboost || 0}</p>
          </div>
          <p className="text-sm text-gray-600">XGBoost</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
            <p className="text-2xl font-bold text-purple-600">{typeCounts.prophet || 0}</p>
          </div>
          <p className="text-sm text-gray-600">Prophet</p>
        </div>
      </div>

      {/* Table */}
      <Table
        data={filteredModels}
        columns={columns}
        loading={isLoading}
        emptyMessage="No models found. Train your first model to get started."
      />
    </div>
  )
}