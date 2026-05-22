import { useContext } from 'react'
import { ToastContext } from '../contexts/ToastContext'

/**
 * Access the Sacred Modernist toast system. Must be used within ToastProvider.
 */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
