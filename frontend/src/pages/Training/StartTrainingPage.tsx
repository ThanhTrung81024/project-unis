import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Play, CheckCircle, AlertCircle } from 'lucide-react'
import { JsonEditor } from '../../components/JsonEditor'
import { useDatasets } from '../../hooks/useDatasets'
import { useStartTraining, useValidateDataset } from '../../hooks/useTraining'
import { z } from 'zod'

const trainingSchema = z.object({
  dataset_id: z.string().min(1, 'Dataset is required'),
  model_type: z.enum(['xgboost', 'prophet', 'lightgbm', 'lstm'], {
    errorMap: () => ({ message: 'Please select a valid model type' })
  }),
  parameters: z.string().optional(),
  test_ratio: z.number().min(0.1).max(0.9),
})

type TrainingForm = z.infer<typeof trainingSchema>

const modelTypes = [
  {
    value: 'xgboost',
    label: 'XGBoost',
    description: 'Gradient boosting for time series forecasting',
    defaultParams: {
      n_estimators: 100,
      learning_rate: 0.1,
      max_depth: 6,
    },
  },
  {
    value: 'prophet',
    label: 'Prophet',
    description: 'Facebook Prophet for time series forecasting',
    defaultParams: {
      yearly_seasonality: true,
      weekly_seasonality: true,
      daily_seasonality: false,
    },
  },
  {
    value: 'lightgbm',
    label: 'LightGBM',
    description: 'Light gradient boosting machine',
    defaultParams: {
      num_leaves: 31,
      learning_rate: 0.1,
      feature_fraction: 0.9,
    },
  },
  {
    value: 'lstm',
    label: 'LSTM',
    description: 'Long Short-Term Memory neural network',
    defaultParams: {
      units: 50,
      epochs: 100,
      batch_size: 32,
    },
  },
]

export const StartTrainingPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedDataset = searchParams.get('dataset')
  
  const [formData, setFormData] = useState<Partial<TrainingForm>>({
    dataset_id: preselectedDataset || '',
    model_type: 'xgboost',
    parameters: JSON.stringify(modelTypes[0].defaultParams, null, 2),
    test_ratio: 0.3,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validationResult, setValidationResult] = useState<any>(null)
  
  const { data: datasetsResponse } = useDatasets()
  const startTraining = useStartTraining()
  const validateDataset = useValidateDataset()

  const datasets = datasetsResponse?.datasets || []

  useEffect(() => {
    if (preselectedDataset && datasets.length > 0) {
      const dataset = datasets.find(d => d.id === preselectedDataset)
      if (dataset) {
        handleValidation(preselectedDataset)
      }
    }
  }, [preselectedDataset, datasets])

  const handleInputChange = (field: keyof TrainingForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user makes changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleModelTypeChange = (modelType: string) => {
    const selectedModel = modelTypes.find(m => m.value === modelType)
    setFormData(prev => ({
      ...prev,
      model_type: modelType as any,
      parameters: JSON.stringify(selectedModel?.defaultParams || {}, null, 2),
    }))
  }

  const handleValidation = async (datasetId: string) => {
    if (!datasetId) return
    
    try {
      const result = await validateDataset.mutateAsync({ dataset_id: datasetId })
      setValidationResult(result.validation)
    } catch (error) {
      setValidationResult(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      let parameters = {}
      if (formData.parameters?.trim()) {
        parameters = JSON.parse(formData.parameters)
      }

      const validatedData = trainingSchema.parse({
        ...formData,
        parameters: formData.parameters,
      })
      
      setErrors({})
      
      const result = await startTraining.mutateAsync({
        dataset_id: validatedData.dataset_id,
        model_type: validatedData.model_type,
        parameters,
        test_ratio: validatedData.test_ratio,
      })
      
      navigate(`/training/jobs/${result.job_id}`)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      } else if (error instanceof SyntaxError) {
        setErrors({ parameters: 'Invalid JSON format in parameters' })
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/training"
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Start Training</h1>
          <p className="text-gray-600">Configure and start a new ML model training job</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dataset Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dataset Selection</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="dataset" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Dataset *
                </label>
                <select
                  id="dataset"
                  value={formData.dataset_id || ''}
                  onChange={(e) => {
                    handleInputChange('dataset_id', e.target.value)
                    handleValidation(e.target.value)
                  }}
                  className={`input ${errors.dataset_id ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                >
                  <option value="">Select a dataset</option>
                  {datasets.map((dataset) => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.name} ({dataset.stats.total_products} products, {dataset.stats.total_weeks} weeks)
                    </option>
                  ))}
                </select>
                {errors.dataset_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.dataset_id}</p>
                )}
              </div>

              {/* Validation Results */}
              {validationResult && (
                <div className={`p-4 rounded-lg ${
                  validationResult.is_sufficient ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    {validationResult.is_sufficient ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        validationResult.is_sufficient ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        Dataset Validation
                      </h3>
                      <div className="mt-2 text-sm">
                        <p className={validationResult.is_sufficient ? 'text-green-700' : 'text-yellow-700'}>
                          {validationResult.total_products} products, {validationResult.total_weeks} weeks, {validationResult.total_records} records
                        </p>
                        {validationResult.recommendations.length > 0 && (
                          <ul className="mt-2 list-disc list-inside space-y-1">
                            {validationResult.recommendations.map((rec: string, index: number) => (
                              <li key={index} className={validationResult.is_sufficient ? 'text-green-700' : 'text-yellow-700'}>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Training Configuration */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Training Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Type *
                </label>
                <div className="space-y-2">
                  {modelTypes.map((model) => (
                    <label key={model.value} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="model_type"
                        value={model.value}
                        checked={formData.model_type === model.value}
                        onChange={(e) => handleModelTypeChange(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{model.label}</p>
                        <p className="text-sm text-gray-500">{model.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.model_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.model_type}</p>
                )}
              </div>

              <div>
                <label htmlFor="test_ratio" className="block text-sm font-medium text-gray-700 mb-1">
                  Test Ratio
                </label>
                <input
                  type="number"
                  id="test_ratio"
                  min="0.1"
                  max="0.9"
                  step="0.1"
                  value={formData.test_ratio || 0.3}
                  onChange={(e) => handleInputChange('test_ratio', parseFloat(e.target.value))}
                  className={`input ${errors.test_ratio ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Percentage of data to use for testing (0.1 - 0.9)
                </p>
                {errors.test_ratio && (
                  <p className="mt-1 text-sm text-red-600">{errors.test_ratio}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Model Parameters */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Model Parameters</h2>
          <JsonEditor
            value={formData.parameters || '{}'}
            onChange={(value) => handleInputChange('parameters', value)}
            placeholder="{}"
            disabled={startTraining.isPending}
          />
          {errors.parameters && (
            <p className="mt-1 text-sm text-red-600">{errors.parameters}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <Link to="/training" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={startTraining.isPending || !validationResult?.is_sufficient}
            className="btn-primary"
          >
            {startTraining.isPending ? (
              <>
                <div className="spinner mr-2" />
                Starting Training...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Training
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}