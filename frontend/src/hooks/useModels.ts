import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { modelsApi } from '../api/models'
import type { UpdateModelRequest, PredictRequest, BatchPredictRequest } from '../types/model'

export const useModels = () => {
  return useQuery({
    queryKey: ['models'],
    queryFn: modelsApi.list,
  })
}

export const useModel = (id: string) => {
  return useQuery({
    queryKey: ['models', id],
    queryFn: () => modelsApi.get(id),
    enabled: !!id,
  })
}

export const useUpdateModel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateModelRequest }) =>
      modelsApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      queryClient.invalidateQueries({ queryKey: ['models', variables.id] })
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update model')
    },
  })
}

export const useDeleteModel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => modelsApi.delete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete model')
    },
  })
}

export const useDeployModel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => modelsApi.deploy(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to deploy model')
    },
  })
}

export const useRetrainModel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, parameters }: { id: string; parameters?: Record<string, unknown> }) =>
      modelsApi.retrain(id, parameters),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to retrain model')
    },
  })
}

export const usePredictSingle = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PredictRequest }) =>
      modelsApi.predict(id, data),
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to make prediction')
    },
  })
}

export const useBatchPredict = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BatchPredictRequest }) =>
      modelsApi.batchPredict(id, data),
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to make batch prediction')
    },
  })
}