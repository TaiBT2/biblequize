import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type ToastType = 'error' | 'warning' | 'info' | 'success'

export interface ToastInput {
  type: ToastType
  message: string
  /** ms before auto-dismiss; 0 = manual only. Default 4000. */
  duration?: number
}

interface Toast extends ToastInput {
  id: string
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void
  dismissToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

const TYPE_META: Record<ToastType, { icon: string; accent: string }> = {
  error: { icon: 'error', accent: '#c54a4a' },
  warning: { icon: 'warning', accent: '#d4951f' },
  info: { icon: 'info', accent: '#e8a832' },
  success: { icon: 'check_circle', accent: '#4a9d6c' },
}

const MAX_VISIBLE = 4

/**
 * Sacred Modernist toast notifications. Top-right viewport stack, auto-dismiss,
 * manual close, Esc dismisses the most recent. Hardcoded hex (no CSS variables
 * — they render against white in the portal layer due to a token-resolution bug).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((toast: ToastInput) => {
    const id = `toast-${Date.now()}-${seq.current++}`
    setToasts((prev) => [...prev, { ...toast, id }].slice(-MAX_VISIBLE))
  }, [])

  // Esc dismisses the most recent toast
  useEffect(() => {
    if (toasts.length === 0) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setToasts((prev) => prev.slice(0, -1))
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [toasts.length])

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {createPortal(
        <div
          style={{
            position: 'fixed', top: 24, right: 24, zIndex: 10000,
            display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 380,
          }}
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
          <style>{`
            @keyframes bq-toast-in {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const meta = TYPE_META[toast.type]
  const duration = toast.duration ?? 4000

  useEffect(() => {
    if (duration <= 0) return
    const timer = setTimeout(() => onDismiss(toast.id), duration)
    return () => clearTimeout(timer)
  }, [toast.id, duration, onDismiss])

  return (
    <div
      role={toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'}
      style={{
        background: 'rgba(20, 22, 32, 0.95)',
        border: '1px solid rgba(232, 168, 50, 0.2)',
        borderLeft: `3px solid ${meta.accent}`,
        borderRadius: 12,
        padding: '12px 16px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        animation: 'bq-toast-in 0.3s ease',
      }}
    >
      <span className="material-symbols-outlined"
            style={{ fontSize: 20, flexShrink: 0, color: meta.accent }}>
        {meta.icon}
      </span>
      <span style={{
        fontSize: 14, fontWeight: 500, color: '#e4e6f0', lineHeight: 1.4, flex: 1,
      }}>
        {toast.message}
      </span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        style={{
          background: 'transparent', border: 'none', color: '#8a8da0',
          cursor: 'pointer', padding: 4, borderRadius: 4, flexShrink: 0,
          display: 'flex', alignItems: 'center',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
      </button>
    </div>
  )
}
