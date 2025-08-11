import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Download, Eye, Edit, Trash2 } from 'lucide-react'
import { Table } from '../../components/Table'
import { useDatasets, useDeleteDataset } from '../../hooks/useDatasets'
import { datasetsApi } from '../../api/datasets'
import { toast } from 'sonner'
import type { Dataset } from '../../types/dataset'

export const DatasetsListPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: datasetsResponse, isLoading } = useDatasets()
  const deleteDataset = useDeleteDataset()

  const datasets = datasetsResponse?.datasets || []

  const filteredDatasets = datasets.filter((dataset) =>
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dataset.filename.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDownload = async (dataset: Dataset) => {
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

  const handleDelete = (dataset: Dataset) => {
    if (window.confirm(`Are you sure you want to delete "${dataset.name}"?`)) {
      deleteDataset.mutate(dataset.id)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (dataset: Dataset) => (
        <div>
          <Link
            to={`/datasets/${dataset.id}`}
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            {dataset.name}
          </Link>
          <p className="text-xs text-gray-500">{dataset.filename}</p>
        </div>
      ),
    },
    {
      key: 'stats.total_products',
      header: 'Products',
      sortable: true,
      render: (dataset: Dataset) => dataset.stats.total_products.toLocaleString(),
    },
    {
      key: 'stats.total_weeks',
      header: 'Weeks',
      sortable: true,
      render: (dataset: Dataset) => dataset.stats.total_weeks.toLocaleString(),
    },
    {
      key: 'stats.total_records',
      header: 'Records',
      sortable: true,
      render: (dataset: Dataset) => dataset.stats.total_records.toLocaleString(),
    },
    {
      key: 'uploaded_at',
      header: 'Uploaded',
      sortable: true,
      render: (dataset: Dataset) => new Date(dataset.uploaded_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (dataset: Dataset) => (
        <div className="flex items-center space-x-2">
          <Link
            to={`/datasets/${dataset.id}`}
            className="text-gray-400 hover:text-gray-600"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button
            onClick={() => handleDownload(dataset)}
            className="text-gray-400 hover:text-gray-600"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(dataset)}
            className="text-gray-400 hover:text-red-600"
            title="Delete"
            disabled={deleteDataset.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Datasets</h1>
          <p className="text-gray-600">Manage your training datasets</p>
        </div>
        <Link to="/datasets/upload" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Upload Dataset
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      {datasetsResponse && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-2xl font-bold text-primary-600">{datasetsResponse.total}</p>
            <p className="text-sm text-gray-600">Total Datasets</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">
              {datasets.reduce((sum, d) => sum + d.stats.total_products, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Products</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-600">
              {datasets.reduce((sum, d) => sum + d.stats.total_records, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Records</p>
          </div>
        </div>
      )}

      {/* Table */}
      <Table
        data={filteredDatasets}
        columns={columns}
        loading={isLoading}
        emptyMessage="No datasets found. Upload your first dataset to get started."
      />
    </div>
  )
}