import {
  REVIEW_SEARCH_FIELD_OPTIONS,
  type ReviewSearchField,
} from '@/domain/cardSearch'

type ReviewCardFilterProps = {
  query: string
  field: ReviewSearchField
  matchCount: number
  totalInQueue: number
  onQueryChange: (value: string) => void
  onFieldChange: (field: ReviewSearchField) => void
}

export function ReviewCardFilter({
  query,
  field,
  matchCount,
  totalInQueue,
  onQueryChange,
  onFieldChange,
}: ReviewCardFilterProps) {
  const filtering = query.trim().length > 0

  return (
    <div className="mb-3 space-y-2 border-b border-slate-200/80 pb-3 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label className="flex items-center gap-2 text-[13px] text-slate-600 dark:text-slate-400">
          <span className="shrink-0">Search in</span>
          <select
            value={field}
            onChange={(e) => onFieldChange(e.target.value as ReviewSearchField)}
            className="max-w-[11rem] border-0 bg-transparent py-0.5 text-[13px] text-accent outline-none focus:underline dark:text-accent"
            aria-label="Field to search"
          >
            {REVIEW_SEARCH_FIELD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        {filtering ? (
          <span className="text-[12px] tabular-nums text-slate-500 dark:text-slate-500">
            {matchCount} of {totalInQueue} cards
          </span>
        ) : null}
      </div>
      <label className="block">
        <span className="sr-only">Filter cards by word</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Type words — each word finds nearest match…"
          className="w-full border-0 bg-transparent px-0 text-[13px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
        />
      </label>
    </div>
  )
}
