import { Link } from 'react-router-dom'

export const studyContentWidthClass = 'mx-auto w-full max-w-[56rem] px-4 sm:px-6 lg:px-10'

type StudyModeHeaderProps = {
  deckId: string
  deckName: string
}

export function StudyModeHeader({ deckId, deckName }: StudyModeHeaderProps) {
  return (
    <header className="shrink-0 border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-surface-950">
      <div className={`${studyContentWidthClass} py-2`}>
        <Link
          to={`/decks/${deckId}`}
          className="inline-flex min-h-[44px] max-w-full items-center gap-1.5 rounded-xl px-1 text-[15px] font-medium text-slate-700 transition hover:bg-slate-100 active:scale-[0.98] dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
          <span className="truncate">{deckName}</span>
        </Link>
      </div>
    </header>
  )
}

