import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { datasetsApi } from '../api/datasets'
import type { CreateDatasetRequest, UpdateDatasetRequest } from '../types/dataset'

export const useDatasets = () => {
  return useQuery({
    queryKey: ['datasets'],
    queryFn: datasetsApi.list,
  })
}

export const useDataset = (id: string) => {
  return useQuery({
    queryKey: ['datasets', id],
    queryFn: () => datasetsApi.get(id),
    enabled: !!id,
  })
}

export const useCreateDataset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDatasetRequest) => datasetsApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to upload dataset')
    },
  })
}

export const useUpdateDataset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDatasetRequest }) =>
      datasetsApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      queryClient.invalidateQueries({ queryKey: ['datasets', variables.id] })
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update dataset')
    },
  })
}

export const useDeleteDataset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => datasetsApi.delete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      toast.success(data.message)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete dataset')
    },
  })
}

export const useDatasetVisualization = (id: string, productCode?: string) => {
  return useQuery({
    queryKey: ['datasets', id, 'visualization', productCode],
    queryFn: () => datasetsApi.getVisualization(id, productCode),
    enabled: !!id,
    retry: false,
  })
}

export const useRawFiles = () => {
  return useQuery({
    queryKey: ['datasets', 'raw'],
    queryFn: datasetsApi.listRaw,
  })
}

export const useProcessedFiles = () => {
  return useQuery({
    queryKey: ['datasets', 'processed'],
    queryFn: datasetsApi.listProcessed,
  })
}