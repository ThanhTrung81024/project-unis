import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Play, 
  Download, 
  Trash2, 
  RefreshCw,
  BarChart3,
  Calendar,
  Target,
  Settings,
  Activity
} from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'
import { JsonEditor } from '../../components/JsonEditor'
import { 
  useModel, 
  useDeleteModel, 
  useDeployModel, 
  useRetrainModel,
  usePredictSingle,
  useBatchPredict
} from '../../hooks/useModels'
import { modelsApi } from '../../api/models'
import { toast } from 'sonner'
import { exportToCsv } from '../../utils/csv'
import { z } from 'zod'

const predictSchema = z.object({
  product_code: z.string().min(1, 'Product code is required'),
  date: z.string().min(1, 'Date is required'),
})

const batchPredictSchema = z.object({
  products: z.string().min(1, 'Products are required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
})

export const ModelDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'predict' | 'batch'>('overview')
  
  // Single prediction form
  const [predictForm, setPredictForm] = useState({
    product_code: '',
    date: '',
  })
  const [predictErrors, setPredictErrors] = useState<Record<string, string>>({})
  const [predictionResult, setPredictionResult] = useState<any>(null)
  
  // Batch prediction form
  const [batchForm, setBatchForm] = useState({
    products: '',
    start_date: '',
    end_date: '',
  })
  const [batchErrors, setBatchErrors] = useState<Record<string, string>>({})
  const [batchResults, setBatchResults] = useState<any[]>([])
  
  const { data: modelResponse, isLoading } = useModel(id!)
  const deleteModel = useDeleteModel()
  const deployModel = useDeployModel()
  const retrainModel = useRetrainModel()
  const predictSingle = usePredictSingle()
  const batchPredict = useBatchPredict()

  const model = modelResponse?.model

  const handleDownload = async () => {
    if (!model) return
    
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

  const handleDeploy = () => {
    if (!model) return
    
    if (window.confirm(`Deploy model "${model.name}"?`)) {
      deployModel.mutate(model.id)
    }
  }

  const handleRetrain = () => {
    if (!model) return
    
    if (window.confirm(`Retrain model "${model.name}"? This will create a new training job.`)) {
      retrainModel.mutate({ id: model.id })
    }
  }

  const handleDelete = () => {
    if (!model) return
    
    if (window.confirm(`Are you sure you want to delete "${model.name}"?`)) {
      deleteModel.mutate(model.id, {
        onSuccess: () => {
          navigate('/models')
        }
      })
    }
  }

  const handleSinglePredict = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const validatedData = predictSchema.parse(predictForm)
      setPredictErrors({})
      
      const result = await predictSingle.mutateAsync({
        id: model!.id,
        data: validatedData,
      })
      
      setPredictionResult(result.prediction)
      toast.success('Prediction completed successfully')
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setPredictErrors(fieldErrors)
      }
    }
  }

  const handleBatchPredict = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const validatedData = batchPredictSchema.parse(batchForm)
      setBatchErrors({})
      
      const products = validatedData.products.split(',').map(p => p.trim()).filter(Boolean)
      
      const result = await batchPredict.mutateAsync({
        id: model!.id,
        data: {
          products,
          start_date: validatedData.start_date,
          end_date: validatedData.end_date,
        },
      })
      
      setBatchResults(result.predictions)
      toast.success(`Batch prediction completed for ${result.predictions.length} products`)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setBatchErrors(fieldErrors)
      }
    }
  }

  const handleExportBatchResults = () => {
    if (batchResults.length === 0) return
    
    const csvData = batchResults.map(result => ({
      'Product Code': result.product_code,
      'Start Date': result.start_date,
      'End Date': result.end_date,
      'Predicted Quantity': result.predicted_quantity,
      'Confidence': result.confidence,
    }))
    
    exportToCsv(csvData, `batch_predictions_${model?.name}_${new Date().toISOString().split('T')[0]}.csv`)
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

  if (!model) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Model not found</p>
        <Link to="/models" className="btn-primary mt-4">
          Back to Models
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/models"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{model.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-gray-500 capitalize">{model.type}</span>
              <StatusBadge status={model.status} />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {model.status === 'ready' && (
            <button
              onClick={handleDeploy}
              className="btn-outline"
              disabled={deployModel.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              Deploy
            </button>
          )}
          <button
            onClick={handleRetrain}
            className="btn-outline"
            disabled={retrainModel.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retrain
          </button>
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
            disabled={deleteModel.isPending}
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
            <Settings className="h-4 w-4 mr-2 inline" />
            Overview
          </button>
          {model.status === 'deployed' && (
            <>
              <button
                onClick={() => setActiveTab('predict')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'predict'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Target className="h-4 w-4 mr-2 inline" />
                Single Predict
              </button>
              <button
                onClick={() => setActiveTab('batch')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'batch'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="h-4 w-4 mr-2 inline" />
                Batch Predict
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Model Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Model Information</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">{model.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="text-sm text-gray-900 capitalize">{model.type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900">
                    <StatusBadge status={model.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(model.created_at).toLocaleString()}
                  </dd>
                </div>
                {model.deployed_at && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Deployed</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(model.deployed_at).toLocaleString()}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="text-sm text-gray-900">
                    {model.description || 'No description provided'}
                  </dd>
                </div>
              </dl>
            </div>

            {model.parameters && Object.keys(model.parameters).length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Parameters</h2>
                <pre className="text-sm bg-gray-50 p-4 rounded-md overflow-auto">
                  {JSON.stringify(model.parameters, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="space-y-6">
            {model.metrics && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-sm text-gray-600">MAE</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {model.metrics.mae?.toFixed(4) || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600">RMSE</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {model.metrics.rmse?.toFixed(4) || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Target className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="text-sm text-gray-600">MAPE</span>
                    </div>
                    <span className={`text-lg font-semibold ${
                      model.metrics.mape ? 
                        model.metrics.mape < 20 ? 'text-green-600' :
                        model.metrics.mape < 50 ? 'text-yellow-600' :
                        'text-red-600'
                      : 'text-gray-900'
                    }`}>
                      {model.metrics.mape ? `${model.metrics.mape.toFixed(2)}%` : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Settings className="h-5 w-5 text-purple-500 mr-2" />
                      <span className="text-sm text-gray-600">R²</span>
                    </div>
                    <span className={`text-lg font-semibold ${
                      model.metrics.r2 ? 
                        model.metrics.r2 > 0.8 ? 'text-green-600' :
                        model.metrics.r2 > 0.5 ? 'text-yellow-600' :
                        'text-red-600'
                      : 'text-gray-900'
                    }`}>
                      {model.metrics.r2?.toFixed(4) || 'N/A'}
                    </span>
                  </div>

                  {model.metrics.total_products && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Products Trained</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {model.metrics.total_products.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-2">
                {model.status === 'ready' && (
                  <button
                    onClick={handleDeploy}
                    className="btn-primary w-full justify-center"
                    disabled={deployModel.isPending}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Deploy Model
                  </button>
                )}
                <button
                  onClick={handleRetrain}
                  className="btn-outline w-full justify-center"
                  disabled={retrainModel.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retrain Model
                </button>
                <button
                  onClick={handleDownload}
                  className="btn-outline w-full justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Model
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'predict' && (
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Single Product Prediction</h2>
            
            <form onSubmit={handleSinglePredict} className="space-y-4">
              <div>
                <label htmlFor="product_code" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Code *
                </label>
                <input
                  type="text"
                  id="product_code"
                  value={predictForm.product_code}
                  onChange={(e) => setPredictForm(prev => ({ ...prev, product_code: e.target.value }))}
                  className={`input ${predictErrors.product_code ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                  placeholder="Enter product code"
                />
                {predictErrors.product_code && (
                  <p className="mt-1 text-sm text-red-600">{predictErrors.product_code}</p>
                )}
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Prediction Date *
                </label>
                <input
                  type="date"
                  id="date"
                  value={predictForm.date}
                  onChange={(e) => setPredictForm(prev => ({ ...prev, date: e.target.value }))}
                  className={`input ${predictErrors.date ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                />
                {predictErrors.date && (
                  <p className="mt-1 text-sm text-red-600">{predictErrors.date}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={predictSingle.isPending}
                className="btn-primary w-full"
              >
                {predictSingle.isPending ? (
                  <>
                    <div className="spinner mr-2" />
                    Predicting...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Make Prediction
                  </>
                )}
              </button>
            </form>

            {predictionResult && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Prediction Result</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-green-600">Product Code</dt>
                    <dd className="font-medium text-green-900">{predictionResult.product_code}</dd>
                  </div>
                  <div>
                    <dt className="text-green-600">Date</dt>
                    <dd className="font-medium text-green-900">{predictionResult.date}</dd>
                  </div>
                  <div>
                    <dt className="text-green-600">Predicted Quantity</dt>
                    <dd className="font-medium text-green-900">{predictionResult.predicted_quantity?.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-green-600">Confidence</dt>
                    <dd className="font-medium text-green-900">{(predictionResult.confidence * 100)?.toFixed(1)}%</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'batch' && (
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Batch Prediction</h2>
            
            <form onSubmit={handleBatchPredict} className="space-y-4">
              <div>
                <label htmlFor="products" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Codes *
                </label>
                <textarea
                  id="products"
                  value={batchForm.products}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, products: e.target.value }))}
                  className={`input min-h-[100px] ${batchErrors.products ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                  placeholder="Enter product codes separated by commas (e.g., PROD001, PROD002, PROD003)"
                  rows={4}
                />
                {batchErrors.products && (
                  <p className="mt-1 text-sm text-red-600">{batchErrors.products}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    value={batchForm.start_date}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className={`input ${batchErrors.start_date ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                  />
                  {batchErrors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{batchErrors.start_date}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    value={batchForm.end_date}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className={`input ${batchErrors.end_date ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                  />
                  {batchErrors.end_date && (
                    <p className="mt-1 text-sm text-red-600">{batchErrors.end_date}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={batchPredict.isPending}
                className="btn-primary w-full"
              >
                {batchPredict.isPending ? (
                  <>
                    <div className="spinner mr-2" />
                    Processing Batch Prediction...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Run Batch Prediction
                  </>
                )}
              </button>
            </form>

            {batchResults.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">
                    Batch Prediction Results ({batchResults.length} products)
                  </h3>
                  <button
                    onClick={handleExportBatchResults}
                    className="btn-outline text-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product Code</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Predicted Quantity</th>
                        <th>Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchResults.map((result, index) => (
                        <tr key={index}>
                          <td className="font-mono">{result.product_code}</td>
                          <td>{result.start_date}</td>
                          <td>{result.end_date}</td>
                          <td className="font-medium">{result.predicted_quantity?.toFixed(2)}</td>
                          <td>
                            <span className={`font-medium ${
                              result.confidence > 0.8 ? 'text-green-600' :
                              result.confidence > 0.6 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {(result.confidence * 100)?.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}