import { api } from '../lib/axios'
import type {
  Model,
  ModelListResponse,
  ModelResponse,
  PredictRequest,
  BatchPredictRequest,
  PredictionResponse,
  BatchPredictionResponse,
  UpdateModelRequest,
} from '../types/model'

export const modelsApi = {
  // List models
  list: async (): Promise<ModelListResponse> => {
    const response = await api.get('/models/')
    return response.data
  },

  // Get model by ID
  get: async (id: string): Promise<ModelResponse> => {
    const response = await api.get(`/models/${id}`)
    return response.data
  },

  // Update model
  update: async (id: string, data: UpdateModelRequest): Promise<{ success: boolean; message: string; model: Model }> => {
    const formData = new FormData()
    if (data.name) formData.append('name', data.name)
    if (data.description) formData.append('description', data.description)
    if (data.tags) formData.append('tags', data.tags)
    if (data.parameters) formData.append('parameters', data.parameters)

    const response = await api.patch(`/models/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Delete model
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/models/${id}`)
    return response.data
  },

  // Deploy model
  deploy: async (id: string): Promise<{ success: boolean; message: string; model: Model }> => {
    const response = await api.post(`/models/${id}/deploy`)
    return response.data
  },

  // Retrain model
  retrain: async (id: string, parameters?: Record<string, unknown>): Promise<{ success: boolean; message: string; model: Model }> => {
    const response = await api.post(`/models/${id}/retrain`, { parameters })
    return response.data
  },

  // Single prediction
  predict: async (id: string, data: PredictRequest): Promise<PredictionResponse> => {
    const response = await api.post(`/models/${id}/predict`, data)
    return response.data
  },

  // Batch prediction
  batchPredict: async (id: string, data: BatchPredictRequest): Promise<BatchPredictionResponse> => {
    const response = await api.post(`/models/${id}/batch_predict`, data)
    return response.data
  },

  // Download model
  download: async (id: string): Promise<Blob> => {
    const response = await api.get(`/models/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  },
}