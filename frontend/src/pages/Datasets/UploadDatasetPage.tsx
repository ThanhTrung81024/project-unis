import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react'
import { FileDropzone } from '../../components/FileDropzone'
import { useCreateDataset } from '../../hooks/useDatasets'
import { z } from 'zod'

const uploadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  tags: z.string().optional(),
  file: z.instanceof(File, { message: 'File is required' }),
})

type UploadForm = z.infer<typeof uploadSchema>

export const UploadDatasetPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<Partial<UploadForm>>({
    name: '',
    description: '',
    tags: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const createDataset = useCreateDataset()

  const handleInputChange = (field: keyof UploadForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setFormData(prev => ({ ...prev, file }))
    // Auto-fill name from filename if empty
    if (!formData.name) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      setFormData(prev => ({ ...prev, name: nameWithoutExt }))
    }
    // Clear file error
    if (errors.file) {
      setErrors(prev => ({ ...prev, file: '' }))
    }
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setFormData(prev => ({ ...prev, file: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const validatedData = uploadSchema.parse({
        ...formData,
        file: selectedFile,
      })
      
      setErrors({})
      
      const result = await createDataset.mutateAsync({
        name: validatedData.name,
        description: validatedData.description,
        tags: validatedData.tags,
        file: validatedData.file,
      })
      
      navigate(`/datasets/${result.dataset_id}`)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/datasets"
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Dataset</h1>
          <p className="text-gray-600">Upload a new dataset for training ML models</p>
        </div>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dataset Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Dataset Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`input ${errors.name ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                placeholder="Enter dataset name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="input resize-none"
                placeholder="Enter dataset description (optional)"
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags || ''}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                className="input"
                placeholder="Enter tags separated by commas (optional)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate multiple tags with commas (e.g., sales, forecast, 2024)
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h2>
          
          <FileDropzone
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onFileRemove={handleFileRemove}
            disabled={createDataset.isPending}
          />
          
          {errors.file && (
            <p className="mt-2 text-sm text-red-600">{errors.file}</p>
          )}
          
          <div className="mt-4 text-sm text-gray-600">
            <h3 className="font-medium mb-2">File Requirements:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Supported formats: Excel (.xlsx) or CSV (.csv)</li>
              <li>Maximum file size: 50MB</li>
              <li>Required columns: DocDate, BranchCode0, BranchName0, CustomerCode, ItemCode, ItemName, Quantity, Unit</li>
              <li>Data should contain sales transactions with dates and quantities</li>
            </ul>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <Link to="/datasets" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createDataset.isPending}
            className="btn-primary"
          >
            {createDataset.isPending ? (
              <>
                <div className="spinner mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Dataset
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Message */}
      {createDataset.isSuccess && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-800">Dataset uploaded successfully!</p>
          </div>
        </div>
      )}
    </div>
  )
}