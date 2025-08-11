export interface TrainingJob {
  id: string
  dataset_id: string
  model_type: 'xgboost' | 'prophet' | 'lightgbm' | 'lstm'
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_at: string
  started_at?: string
  completed_at?: string
  error?: string
}

export interface JobListResponse {
  success: boolean
  jobs: TrainingJob[]
  total: number
}

export interface JobStatusResponse {
  success: boolean
  job_id: string
  status: string
  created_at: string
  started_at?: string
  completed_at?: string
  error?: string
}

export interface JobResult {
  success: boolean
  job_id: string
  model_type: string
  metrics: {
    mae: number
    rmse: number
    mape: number
    r2: number
  }
  results_file?: string
  plot_file?: string
}

export interface TrainRequest {
  dataset_id: string
  model_type: 'xgboost' | 'prophet' | 'lightgbm' | 'lstm'
  parameters?: Record<string, unknown>
  test_ratio: number
}

export interface ValidateRequest {
  dataset_id: string
}

export interface ValidationResult {
  total_products: number
  total_weeks: number
  total_records: number
  missing_values: Record<string, number>
  data_range: {
    start: string
    end: string
  }
  quantity_stats: {
    mean: number
    std: number
    min: number
    max: number
  }
  is_sufficient: boolean
  recommendations: string[]
}

export interface ValidationResponse {
  success: boolean
  validation: ValidationResult
}