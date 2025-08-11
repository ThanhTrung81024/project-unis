import axios from 'axios'
import { toast } from 'sonner'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred'
    
    // Don't show toast for certain endpoints that handle errors themselves
    const silentEndpoints = ['/health', '/datasets/', '/models/']
    const shouldShowToast = !silentEndpoints.some(endpoint => 
      error.config?.url?.includes(endpoint)
    )
    
    if (shouldShowToast) {
      toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

export default api