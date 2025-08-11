import { useState, useEffect } from 'react'
import { AlertCircle, Check } from 'lucide-react'

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const JsonEditor = ({
  value,
  onChange,
  placeholder = '{}',
  className = '',
  disabled = false,
}: JsonEditorProps) => {
  const [isValid, setIsValid] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!value.trim()) {
      setIsValid(true)
      setError('')
      return
    }

    try {
      JSON.parse(value)
      setIsValid(true)
      setError('')
    } catch (err) {
      setIsValid(false)
      setError(err instanceof Error ? err.message : 'Invalid JSON')
    }
  }, [value])

  const handleChange = (newValue: string) => {
    onChange(newValue)
  }

  return (
    <div className={className}>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`input min-h-[120px] font-mono text-sm resize-y ${
            !isValid ? 'border-red-300 focus-visible:ring-red-500' : ''
          }`}
          rows={6}
        />
        <div className="absolute top-2 right-2">
          {value.trim() && (
            <>
              {isValid ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </>
          )}
        </div>
      </div>
      
      {!isValid && error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      <p className="mt-1 text-xs text-gray-500">
        Enter valid JSON format for model parameters
      </p>
    </div>
  )
}