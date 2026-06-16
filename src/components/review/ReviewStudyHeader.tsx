import { Link } from 'react-router-dom'
import { ReviewDeckSelector } from '@/components/review/ReviewDeckSelector'
import type { ReviewQueueFilter } from '@/domain/reviewQueue'

type ReviewStudyHeaderProps = {
  current: number
  total: number
  queue: ReviewQueueFilter
  queueCounts: Record<ReviewQueueFilter, number>
  onQueueChange: (queue: ReviewQueueFilter) => void
}

const queueTabs: { id: ReviewQueueFilter; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'review', label: 'Review' },
]

export function ReviewStudyHeader({
  current,
  total,
  queue,
  queueCounts,
  onQueueChange,
}: ReviewStudyHeaderProps) {
  const progress = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <header className="shrink-0 border-b border-slate-200/80 bg-white/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm dark:border-slate-800 dark:bg-surface-950/95">
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to="/decks"
            aria-label="Exit study"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition active:bg-slate-100 dark:text-slate-400 dark:active:bg-slate-800"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Link>
          <ReviewDeckSelector variant="study" />
        </div>
        <p className="shrink-0 text-[14px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
          {current}/{total}
        </p>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Card queue">
        {queueTabs.map((tab) => {
          const active = queue === tab.id
          const count = queueCounts[tab.id]
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onQueueChange(tab.id)}
              className={[
                'inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition',
                active
                  ? 'bg-accent text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
              ].join(' ')}
            >
              {tab.label}
              <span
                className={[
                  'tabular-nums',
                  active ? 'text-white/80' : 'text-slate-400 dark:text-slate-500',
                ].join(' ')}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </header>
  )
}
