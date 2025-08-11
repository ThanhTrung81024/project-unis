import { api } from '../lib/axios'
import type {
  Dataset,
  DatasetDetail,
  DatasetListResponse,
  DatasetResponse,
  CreateDatasetRequest,
  UpdateDatasetRequest,
  FileListResponse,
} from '../types/dataset'

export const datasetsApi = {
  // List datasets
  list: async (): Promise<DatasetListResponse> => {
    const response = await api.get('/datasets/')
    return response.data
  },

  // Get dataset by ID
  get: async (id: string): Promise<DatasetResponse> => {
    const response = await api.get(`/datasets/${id}`)
    return response.data
  },

  // Create new dataset
  create: async (data: CreateDatasetRequest): Promise<{ success: boolean; dataset_id: string; message: string; stats: any }> => {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('name', data.name)
    if (data.description) {
      formData.append('description', data.description)
    }
    if (data.tags) {
      formData.append('tags', data.tags)
    }

    const response = await api.post('/datasets/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Update dataset
  update: async (id: string, data: UpdateDatasetRequest): Promise<{ success: boolean; message: string; dataset: DatasetDetail }> => {
    const formData = new FormData()
    if (data.name) formData.append('name', data.name)
    if (data.description) formData.append('description', data.description)
    if (data.tags) formData.append('tags', data.tags)

    const response = await api.patch(`/datasets/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Delete dataset
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/datasets/${id}`)
    return response.data
  },

  // Download dataset
  download: async (id: string): Promise<Blob> => {
    const response = await api.get(`/datasets/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  // Get dataset visualization
  getVisualization: async (id: string, productCode?: string): Promise<Blob> => {
    const params = productCode ? { product_code: productCode } : {}
    const response = await api.get(`/datasets/${id}/visualization`, {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  // List raw files
  listRaw: async (): Promise<FileListResponse> => {
    const response = await api.get('/datasets/raw/list')
    return response.data
  },

  // List processed files
  listProcessed: async (): Promise<FileListResponse> => {
    const response = await api.get('/datasets/processed/list')
    return response.data
  },
}