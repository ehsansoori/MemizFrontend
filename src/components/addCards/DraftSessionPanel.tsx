import { DraftSessionStats } from '@/components/addCards/DraftSessionStats'

type DraftSessionPanelProps = {
  currentIndex: number
  total: number
  draftTotal: number
  saved: number
  remaining: number
  busy?: boolean
  deckName: string
  onPrev: () => void
  onNext: () => void
  onSaveCard: () => void
  onSaveAll: () => void
  onRegenerate: () => void
  onDeleteCard: () => void
  onClearSession: () => void
}

function ActionButton({
  label,
  onClick,
  disabled,
  variant = 'secondary',
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const styles = {
    primary: 'bg-accent text-white',
    secondary: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
    danger: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex min-h-[44px] flex-1 items-center justify-center rounded-xl px-3 text-[13px] font-semibold transition active:scale-[0.98] disabled:opacity-40',
        styles[variant],
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export function DraftSessionPanel({
  currentIndex,
  total,
  draftTotal,
  saved,
  remaining,
  busy,
  deckName,
  onPrev,
  onNext,
  onSaveCard,
  onSaveAll,
  onRegenerate,
  onDeleteCard,
  onClearSession,
}: DraftSessionPanelProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200/90 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-surface-950/95">
      <div className="mx-auto max-w-lg space-y-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <DraftSessionStats draftTotal={draftTotal} saved={saved} remaining={remaining} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={busy || currentIndex <= 0}
            aria-label="Previous card"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <p className="min-w-0 flex-1 text-center text-[14px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
            Card {currentIndex + 1}/{total}
          </p>
          <button
            type="button"
            onClick={onNext}
            disabled={busy || currentIndex >= total - 1}
            aria-label="Next card"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <ActionButton
            label="Save Card"
            onClick={onSaveCard}
            disabled={busy}
            variant="primary"
          />
          <ActionButton label="Regenerate" onClick={onRegenerate} disabled={busy} />
          <ActionButton
            label="Delete Card"
            onClick={onDeleteCard}
            disabled={busy}
            variant="danger"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <ActionButton
            label="Save All"
            onClick={onSaveAll}
            disabled={busy || remaining === 0}
            variant="primary"
          />
          <ActionButton
            label="Clear Draft Session"
            onClick={onClearSession}
            disabled={busy}
            variant="danger"
          />
        </div>

        <p className="truncate text-center text-[11px] text-slate-400">
          Save to {deckName}
        </p>
      </div>
    </div>
  )
}
