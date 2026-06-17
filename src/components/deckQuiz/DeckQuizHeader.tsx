import { Link } from 'react-router-dom'

type DeckQuizHeaderProps = {
  deckId: string
  deckName: string
  current: number
  total: number
}

export function DeckQuizHeader({ deckId, deckName, current, total }: DeckQuizHeaderProps) {
  const progress = total > 0 ? (current / total) * 100 : 0

  return (
    <header className="shrink-0 border-b border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-surface-950">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <Link
          to={`/decks/${deckId}`}
          aria-label="Back to deck"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition active:bg-slate-100 dark:text-slate-300 dark:active:bg-slate-800"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">
            Quiz · {deckName}
          </p>
          <p className="text-[12px] tabular-nums text-slate-500 dark:text-slate-400">
            {current} / {total}
          </p>
        </div>
      </div>
      <div className="mx-auto mt-3 h-1.5 max-w-lg overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  )
}
