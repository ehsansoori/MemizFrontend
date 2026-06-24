type BulkRegenerateWarningDialogProps = {
  open: boolean
  busy?: boolean
  cardCount: number
  onCancel: () => void
  onConfirm: () => void
}

export function BulkRegenerateWarningDialog({
  open,
  busy,
  cardCount,
  onCancel,
  onConfirm,
}: BulkRegenerateWarningDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={() => !busy && onCancel()}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="bulk-regenerate-warning-title"
        className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl dark:bg-surface-900"
      >
        <h3
          id="bulk-regenerate-warning-title"
          className="text-[17px] font-bold text-slate-900 dark:text-white"
        >
          Overwrite generated content?
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">
          This action may overwrite existing generated content on all{' '}
          <strong>{cardCount}</strong> card{cardCount === 1 ? '' : 's'} in this deck,
          including translations, pronunciations, examples, and part of speech.
        </p>
        <p className="mt-2 text-[14px] font-medium text-slate-700 dark:text-slate-200">
          Do you want to continue?
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="h-12 rounded-2xl bg-accent text-[14px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            Continue
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-12 rounded-2xl bg-slate-100 text-[14px] font-semibold text-slate-700 transition active:scale-[0.98] disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
