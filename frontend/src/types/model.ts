export interface Model {
  id: string
  name: string
  type: 'xgboost' | 'prophet' | 'lightgbm' | 'lstm'
  dataset_id: string
  status: 'ready' | 'deployed' | 'training' | 'failed'
  metrics?: {
    mae: number
    rmse: number
    mape: number
    r2: number
    total_products?: number
  }
  created_at: string
  deployed_at?: string
  parameters?: Record<string, unknown>
  tags?: string[]
  description?: string
}

export interface ModelListResponse {
  success: boolean
  models: Model[]
  total: number
}

export interface ModelResponse {
  success: boolean
  model: Model
}

export interface PredictRequest {
  product_code: string
  date: string
}

export interface BatchPredictRequest {
  products: string[]
  start_date: string
  end_date: string
}

export interface PredictionResponse {
  success: boolean
  prediction: {
    product_code: string
    date: string
    predicted_quantity: number
    confidence: number
  }
}

export interface BatchPredictionResponse {
  success: boolean
  predictions: Array<{
    product_code: string
    start_date: string
    end_date: string
    predicted_quantity: number
    confidence: number
  }>
  total: number
}

export interface UpdateModelRequest {
  name?: string
  description?: string
  tags?: string
  parameters?: string
}