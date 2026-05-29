type LoadingOverlayProps = {
  message?: string
}

export function LoadingOverlay({ message = 'Generating cards…' }: LoadingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm dark:bg-black/50"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-2xl dark:border-slate-700 dark:bg-surface-900">
        <span
          className="h-10 w-10 animate-spin rounded-full border-[3px] border-accent border-t-transparent"
          aria-hidden
        />
        <p className="text-center text-sm font-medium text-slate-700 dark:text-slate-200">
          {message}
        </p>
      </div>
    </div>
  )
}
