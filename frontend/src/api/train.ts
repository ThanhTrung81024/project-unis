import { api } from '../lib/axios'
import type {
  TrainRequest,
  ValidateRequest,
  ValidationResponse,
  JobListResponse,
  JobStatusResponse,
  JobResult,
} from '../types/job'

export const trainApi = {
  // Start training
  train: async (data: TrainRequest): Promise<{ success: boolean; job_id: string; message: string; status: string }> => {
    const response = await api.post('/train/', data)
    return response.data
  },

  // Validate dataset
  validate: async (data: ValidateRequest): Promise<ValidationResponse> => {
    const response = await api.post('/train/validate', data)
    return response.data
  },

  // List training jobs
  listJobs: async (): Promise<JobListResponse> => {
    const response = await api.get('/train/jobs')
    return response.data
  },

  // Get job status
  getJobStatus: async (jobId: string): Promise<JobStatusResponse> => {
    const response = await api.get(`/train/job/${jobId}/status`)
    return response.data
  },

  // Get job result
  getJobResult: async (jobId: string): Promise<JobResult> => {
    const response = await api.get(`/train/job/${jobId}/result`)
    return response.data
  },
}