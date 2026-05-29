type CardNavigationProps = {
  currentIndex: number
  total: number
  onPrev: () => void
  onNext: () => void
  disabled?: boolean
}

export function CardNavigation({
  currentIndex,
  total,
  onPrev,
  onNext,
  disabled,
}: CardNavigationProps) {
  const human = total > 0 ? currentIndex + 1 : 0
  const atStart = disabled || currentIndex <= 0
  const atEnd = disabled || currentIndex >= total - 1 || total === 0

  return (
    <nav
      className="flex w-full max-w-3xl items-center justify-between gap-3 border-t border-slate-200/70 pt-3 text-[13px] dark:border-slate-800/80"
      aria-label="Card navigation"
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={atStart}
        className="shrink-0 rounded-md px-2 py-1 font-medium text-slate-500 transition hover:bg-slate-100/90 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
      >
        <span aria-hidden className="mr-0.5 text-slate-400 dark:text-slate-500">
          ←
        </span>
        Previous
      </button>
      <p
        className="min-w-0 truncate text-center text-[12px] tabular-nums text-slate-400 dark:text-slate-500"
        aria-live="polite"
      >
        <span className="font-medium text-slate-600 dark:text-slate-300">{human}</span>
        <span className="mx-0.5 text-slate-300 dark:text-slate-600">/</span>
        <span>{total}</span>
      </p>
      <button
        type="button"
        onClick={onNext}
        disabled={atEnd}
        className="shrink-0 rounded-md px-2 py-1 font-medium text-slate-500 transition hover:bg-slate-100/90 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
      >
        Next
        <span aria-hidden className="ml-0.5 text-slate-400 dark:text-slate-500">
          →
        </span>
      </button>
    </nav>
  )
}
