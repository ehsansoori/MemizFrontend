import { studyContentWidthClass } from '@/components/deckStudy/StudyModeHeader'

type StudyBottomToolbarProps = {
  current: number
  total: number
  canGoPrev: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
  onOpenNavigator: () => void
}

const iconBtnClass =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 active:scale-95 disabled:opacity-30 dark:text-slate-200 dark:hover:bg-slate-800'

export function StudyBottomToolbar({
  current,
  total,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onOpenNavigator,
}: StudyBottomToolbarProps) {
  return (
    <nav
      aria-label="Card navigation"
      className="shrink-0 border-t border-slate-100 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-surface-950/95"
    >
      <div
        className={`${studyContentWidthClass} flex items-center justify-between gap-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]`}
      >
        <button
          type="button"
          disabled={!canGoPrev}
          aria-label="Previous card"
          onClick={onPrev}
          className={iconBtnClass}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onOpenNavigator}
          className="min-h-[44px] min-w-[5.5rem] flex-1 rounded-xl px-3 text-center text-[15px] font-semibold tabular-nums text-slate-800 transition hover:bg-slate-100 active:scale-[0.98] dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {current} / {total}
        </button>

        <button
          type="button"
          disabled={!canGoNext}
          aria-label="Next card"
          onClick={onNext}
          className={iconBtnClass}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
          </svg>
        </button>

        <button
          type="button"
          aria-label="Search cards"
          onClick={onOpenNavigator}
          className={iconBtnClass}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
      </div>
    </nav>
  )
}
