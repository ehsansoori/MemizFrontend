import { createContext, useContext } from 'react'

export type ToastVariant = 'default' | 'error' | 'success'

export type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void
  dismissToast: () => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
