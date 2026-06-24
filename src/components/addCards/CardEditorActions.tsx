type CardEditorActionsProps = {
  showSaveCancel?: boolean
  onSave?: () => void
  onCancel?: () => void
  saveBusy?: boolean
  busy?: boolean
  saveDisabled?: boolean
  saveLabel?: string
  cancelLabel?: string
}

export function CardEditorActions({
  showSaveCancel = false,
  onSave,
  onCancel,
  saveBusy,
  busy,
  saveDisabled,
  saveLabel = 'Save Card',
  cancelLabel = 'Cancel',
}: CardEditorActionsProps) {
  if (!showSaveCancel) return null

  return (
    <div className="flex gap-2 pt-1">
      <button
        type="button"
        onClick={onSave}
        disabled={busy || saveDisabled}
        className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-slate-900 text-[15px] font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
      >
        {saveBusy ? 'Saving…' : saveLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 text-[15px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {cancelLabel}
      </button>
    </div>
  )
}
