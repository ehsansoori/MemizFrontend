import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ToastContext, type ToastVariant } from '@/providers/toastContext'

type ToastState = {
  message: string
  variant: ToastVariant
} | null

const TOAST_MS = 4500

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null)

  const dismissToast = useCallback(() => setToast(null), [])

  const showToast = useCallback((message: string, variant: ToastVariant = 'default') => {
    setToast({ message, variant })
    window.setTimeout(() => setToast(null), TOAST_MS)
  }, [])

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast],
  )

  const toastStyles =
    toast?.variant === 'error'
      ? 'border-red-200/90 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/90 dark:text-red-100'
      : toast?.variant === 'success'
        ? 'border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/90 dark:text-emerald-100'
        : 'border-slate-200/90 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          role="status"
          className={`toast-enter fixed bottom-6 left-1/2 z-[110] max-w-[min(92vw,24rem)] -translate-x-1/2 rounded-xl border px-4 py-3 text-center text-sm font-medium shadow-lg ${toastStyles}`}
        >
          {toast.message}
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}
