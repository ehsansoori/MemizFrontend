import { getStudyCardDisplay, studyCardMetadataLine } from '@/domain/cardFaceText'
import type { SavedCard } from '@/types/cards'

type StudyCardViewProps = {
  card: SavedCard
  menuDisabled?: boolean
  onMenu: () => void
}

export function StudyCardView({ card, menuDisabled, onMenu }: StudyCardViewProps) {
  const display = getStudyCardDisplay(card)
  const metadata = studyCardMetadataLine(display)
  const hasExamples = display.examples.length > 0

  return (
    <article className="relative rounded-3xl border border-slate-200/80 bg-white px-6 py-9 shadow-card dark:border-slate-700/70 dark:bg-surface-900 dark:shadow-card-dark">
      <button
        type="button"
        disabled={menuDisabled}
        aria-label="Card actions"
        onClick={onMenu}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:scale-95 disabled:opacity-40 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>

      <div className="pr-6">
        <p className="whitespace-pre-wrap text-[clamp(1.75rem,7vw,2.25rem)] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
          {display.word}
        </p>

        {display.meaning ? (
          <p className="mt-7 whitespace-pre-wrap text-[clamp(1.25rem,5vw,1.5rem)] font-medium leading-snug text-slate-800 dark:text-slate-100">
            {display.meaning}
          </p>
        ) : (
          <p className="mt-7 text-[16px] text-slate-400 dark:text-slate-500">No meaning yet</p>
        )}

        {display.englishMeaning ? (
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
            {display.englishMeaning}
          </p>
        ) : null}

        {metadata ? (
          <p className="mt-4 font-mono text-[13px] leading-relaxed text-slate-400 dark:text-slate-500">
            {metadata}
          </p>
        ) : null}

        {hasExamples ? (
          <div className="mt-7 space-y-2.5 border-t border-slate-100 pt-5 dark:border-slate-800">
            {display.examples.map((ex, i) => (
              <div key={`${ex.text}-${i}`}>
                <p className="text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {ex.text}
                </p>
                {ex.translation ? (
                  <p className="mt-0.5 text-[13px] italic text-slate-400 dark:text-slate-500">
                    {ex.translation}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}
