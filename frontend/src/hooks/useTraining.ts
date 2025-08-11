import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trainApi } from '../api/train'
import type { TrainRequest, ValidateRequest } from '../types/job'

export const useTrainingJobs = () => {
  return useQuery({
    queryKey: ['training', 'jobs'],
    queryFn: trainApi.listJobs,
  })
}

export const useJobStatus = (jobId: string) => {
  return useQuery({
    queryKey: ['training', 'jobs', jobId, 'status'],
    queryFn: () => trainApi.getJobStatus(jobId),
    enabled: !!jobId,
    refetchInterval: (data) => {
      // Stop polling when job is completed or failed
      const status = data?.status
      return status === 'completed' || status === 'failed' ? false : 2000
    },
  })
}

export const useJobResult = (jobId: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ['training', 'jobs', jobId, 'result'],
    queryFn: () => trainApi.getJobResult(jobId),
    enabled: enabled && !!jobId,
  })
}

export const useStartTraining = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TrainRequest) => trainApi.train(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['training', 'jobs'] })
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to start training')
    },
  })
}

export const useValidateDataset = () => {
  return useMutation({
    mutationFn: (data: ValidateRequest) => trainApi.validate(data),
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to validate dataset')
    },
  })
}