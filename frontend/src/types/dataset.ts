export interface Dataset {
  id: string
  name: string
  description?: string
  tags: string[]
  filename: string
  uploaded_at: string
  stats: {
    total_products: number
    total_weeks: number
    total_records: number
    date_range: {
      start: string
      end: string
    }
  }
}

export interface DatasetDetail extends Dataset {
  file_path: string
  processed_file: string
}

export interface CreateDatasetRequest {
  name: string
  description?: string
  tags?: string
  file: File
}

export interface UpdateDatasetRequest {
  name?: string
  description?: string
  tags?: string
}

export interface DatasetListResponse {
  success: boolean
  datasets: Dataset[]
  total: number
}

export interface DatasetResponse {
  success: boolean
  dataset: DatasetDetail
}

export interface FileListResponse {
  success: boolean
  files: string[]
  total: number
}