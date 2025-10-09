import React, { useEffect, useState } from 'react'

interface ErrorToastProps {
  message: string
  onClose: () => void
  duration?: number
  type?: 'error' | 'warning' | 'info'
}

export default function ErrorToast({ 
  message, 
  onClose, 
  duration = 5000, 
  type = 'error' 
}: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 300) // Match animation duration
  }

  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-yellow-900/20',
          border: 'border-yellow-500/30',
          icon: 'text-yellow-400',
          text: 'text-yellow-100'
        }
      case 'info':
        return {
          bg: 'bg-blue-900/20',
          border: 'border-blue-500/30',
          icon: 'text-blue-400',
          text: 'text-blue-100'
        }
      default:
        return {
          bg: 'bg-red-900/20',
          border: 'border-red-500/30',
          icon: 'text-red-400',
          text: 'text-red-100'
        }
    }
  }

  const styles = getStyles()

  return (
    <div 
      className={`fixed top-4 right-4 z-50 max-w-sm w-full mx-4 transform transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div className={`${styles.bg} ${styles.border} border rounded-lg p-4 shadow-lg backdrop-blur-sm`}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${styles.icon}`}>
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${styles.text}`}>
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className={`inline-flex ${styles.text} hover:opacity-75 transition-opacity`}
            >
              <span className="sr-only">Đóng</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
