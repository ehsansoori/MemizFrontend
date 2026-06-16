type DraftConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DraftConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  busy,
  onConfirm,
  onCancel,
}: DraftConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={() => !busy && onCancel()}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="draft-confirm-title"
        className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl dark:bg-surface-900"
      >
        <h3
          id="draft-confirm-title"
          className="text-[17px] font-bold text-slate-900 dark:text-white"
        >
          {title}
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">
          {message}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-12 flex-1 rounded-2xl bg-slate-100 text-[14px] font-semibold text-slate-700 transition active:scale-[0.98] disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={[
              'h-12 flex-1 rounded-2xl text-[14px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50',
              destructive ? 'bg-red-500' : 'bg-accent',
            ].join(' ')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
