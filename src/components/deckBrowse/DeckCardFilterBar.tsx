import {
  DECK_CARD_STATUS_FILTERS,
  type DeckCardStatusFilter,
} from '@/domain/deckCardList'

type DeckCardFilterBarProps = {
  query: string
  onQueryChange: (value: string) => void
  statusFilter: DeckCardStatusFilter
  onStatusFilterChange: (filter: DeckCardStatusFilter) => void
  statusCounts: Record<DeckCardStatusFilter, number>
}

export function DeckCardFilterBar({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
}: DeckCardFilterBarProps) {
  return (
    <>
      <div className="relative mb-4">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search cards"
          aria-label="Search cards"
          className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/25 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800"
        />
      </div>

      <div
        className="mb-4 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Card status filters"
      >
        {DECK_CARD_STATUS_FILTERS.map((tab) => {
          const active = statusFilter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onStatusFilterChange(tab.id)}
              className={[
                'inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition',
                active
                  ? 'bg-accent text-white shadow-sm'
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
                {statusCounts[tab.id]}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
