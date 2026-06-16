type DraftLeaveDialogProps = {
  open: boolean
  busy?: boolean
  onStay: () => void
  onSaveAndLeave: () => void
  onLeaveAnyway: () => void
}

export function DraftLeaveDialog({
  open,
  busy,
  onStay,
  onSaveAndLeave,
  onLeaveAnyway,
}: DraftLeaveDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={() => !busy && onStay()}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="draft-leave-title"
        className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl dark:bg-surface-900"
      >
        <h3
          id="draft-leave-title"
          className="text-[17px] font-bold text-slate-900 dark:text-white"
        >
          Unsaved draft cards
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">
          You have unsaved draft cards. Save before leaving?
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onSaveAndLeave}
            className="h-12 rounded-2xl bg-accent text-[14px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            Save All & Leave
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onStay}
            className="h-12 rounded-2xl bg-slate-100 text-[14px] font-semibold text-slate-700 transition active:scale-[0.98] disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200"
          >
            Stay
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onLeaveAnyway}
            className="h-12 rounded-2xl text-[14px] font-semibold text-red-600 transition active:scale-[0.98] disabled:opacity-50 dark:text-red-400"
          >
            Leave anyway
          </button>
        </div>
      </div>
    </div>
  )
}
