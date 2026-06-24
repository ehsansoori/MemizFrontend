type DeckTemplateChangeChoiceDialogProps = {
  open: boolean
  busy?: boolean
  variant?: 'change' | 'update' | 'make_card' | 'edit_card'
  onApplyToAll: () => void
  onOnlyNewCards: () => void
  onCancel: () => void
}

export function DeckTemplateChangeChoiceDialog({
  open,
  busy,
  variant = 'change',
  onApplyToAll,
  onOnlyNewCards,
  onCancel,
}: DeckTemplateChangeChoiceDialogProps) {
  if (!open) return null

  const isUpdate = variant === 'update'
  const isMakeCard = variant === 'make_card'
  const isEditCard = variant === 'edit_card'
  const isCardEditor = isMakeCard || isEditCard

  const title = isCardEditor
    ? 'Template in use'
    : isUpdate
      ? 'You updated the current deck template'
      : 'You changed the deck template'

  const intro = isCardEditor
    ? 'This template is already being used by cards in this deck. What would you like to do?'
    : 'What would you like to do?'

  const applyLabel = isUpdate ? 'updated template' : 'new template'

  const onlyNewLabel = isEditCard ? 'Only This Card' : 'Only New Cards'

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
        aria-labelledby="deck-template-change-title"
        className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl dark:bg-surface-900"
      >
        <h3
          id="deck-template-change-title"
          className="text-[17px] font-bold text-slate-900 dark:text-white"
        >
          {title}
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">
          {intro}
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-slate-700 dark:text-slate-300">
          <li>
            Apply the {isCardEditor ? 'template changes' : applyLabel} to{' '}
            <strong>all existing cards</strong> in this deck and regenerate them with AI.
          </li>
          <li>
            {isEditCard ? (
              <>
                Apply the template changes to <strong>this card only</strong> and leave other cards
                unchanged.
              </>
            ) : isMakeCard ? (
              <>
                Save the template changes for <strong>new cards only</strong>; existing cards stay
                unchanged.
              </>
            ) : (
              <>
                Use the {applyLabel} only for <strong>new cards</strong> created from now on.
              </>
            )}
          </li>
        </ol>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onApplyToAll}
            className="h-12 rounded-2xl bg-accent text-[14px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            Apply To All Cards
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onOnlyNewCards}
            className="h-12 rounded-2xl bg-slate-100 text-[14px] font-semibold text-slate-800 transition active:scale-[0.98] disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100"
          >
            {onlyNewLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-12 rounded-2xl text-[14px] font-semibold text-slate-500 transition active:scale-[0.98] disabled:opacity-50 dark:text-slate-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
