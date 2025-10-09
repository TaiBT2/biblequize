import React, { createContext, useContext, useState, ReactNode } from 'react'
import ErrorToast from '../components/ErrorToast'

interface ErrorContextType {
  showError: (message: string, type?: 'error' | 'warning' | 'info') => void
  clearErrors: () => void
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export const useError = () => {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

interface ErrorProviderProps {
  children: ReactNode
}

interface ErrorState {
  id: string
  message: string
  type: 'error' | 'warning' | 'info'
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorState[]>([])

  const showError = (message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    const id = Date.now().toString()
    const newError: ErrorState = { id, message, type }
    
    setErrors(prev => [...prev, newError])
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeError(id)
    }, 5000)
  }

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }

  const clearErrors = () => {
    setErrors([])
  }

  return (
    <ErrorContext.Provider value={{ showError, clearErrors }}>
      {children}
      
      {/* Render error toasts */}
      {errors.map(error => (
        <ErrorToast
          key={error.id}
          message={error.message}
          type={error.type}
          onClose={() => removeError(error.id)}
        />
      ))}
    </ErrorContext.Provider>
  )
}
