import { getStudyCardDisplay } from '@/domain/cardFaceText'
import type { SavedCard } from '@/types/cards'

type StudyCardViewProps = {
  card: SavedCard
  menuDisabled?: boolean
  onMenu: () => void
}

export function StudyCardView({ card, menuDisabled, onMenu }: StudyCardViewProps) {
  const display = getStudyCardDisplay(card)
  const hasExamples = display.examples.length > 0
  const hasMeaning = Boolean(display.meaning || display.englishMeaning)
  const hasMetadata = Boolean(display.partOfSpeech)

  return (
    <article className="flex min-h-0 flex-1 flex-col">
      <header className="sticky top-0 z-10 shrink-0 border-b border-slate-100 bg-white/95 pb-3 pt-0.5 backdrop-blur-sm dark:border-slate-800/80 dark:bg-surface-950/95">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="whitespace-pre-wrap font-display text-[clamp(2.25rem,8vw,3.5rem)] font-bold leading-[1.08] tracking-tight text-slate-900 dark:text-white">
              {display.word}
            </h1>
            {display.phonetic ? (
              <p className="mt-1.5 font-mono text-[clamp(0.95rem,3vw,1.2rem)] text-slate-400 dark:text-slate-500">
                {display.phonetic}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={menuDisabled}
            aria-label="Card actions"
            onClick={onMenu}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:scale-95 disabled:opacity-40 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="12" cy="5" r="1.75" />
              <circle cx="12" cy="12" r="1.75" />
              <circle cx="12" cy="19" r="1.75" />
            </svg>
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-6 pt-5 scrollbar-minimal sm:pt-6">
        {hasMeaning ? (
          <section className="mb-6 sm:mb-7">
            {display.meaning ? (
              <p className="whitespace-pre-wrap text-[clamp(1.875rem,5.5vw,2.75rem)] font-semibold leading-snug text-slate-900 dark:text-white">
                {display.meaning}
              </p>
            ) : null}
            {display.englishMeaning ? (
              <p
                className={[
                  'whitespace-pre-wrap text-[clamp(1.125rem,3.5vw,1.5rem)] leading-relaxed text-slate-500 dark:text-slate-400',
                  display.meaning ? 'mt-2.5' : '',
                ].join(' ')}
              >
                {display.englishMeaning}
              </p>
            ) : null}
          </section>
        ) : (
          <p className="mb-6 text-[17px] text-slate-400 dark:text-slate-500">No meaning yet</p>
        )}

        {hasExamples ? (
          <section className="border-t border-slate-100 pt-5 dark:border-slate-800 sm:pt-6">
            <h2 className="mb-4 text-[13px] font-semibold text-slate-500 dark:text-slate-400">
              Examples
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {display.examples.map((ex, i) => (
                <div key={`${ex.text}-${i}`} className="py-4 first:pt-0 last:pb-0 sm:py-5">
                  {display.examples.length > 1 ? (
                    <p className="mb-1.5 text-[13px] font-medium text-slate-400 dark:text-slate-500">
                      Example {i + 1}
                    </p>
                  ) : null}
                  <p className="text-[clamp(1.05rem,3vw,1.2rem)] leading-relaxed text-slate-700 dark:text-slate-200">
                    {ex.text}
                  </p>
                  {ex.translation ? (
                    <p className="mt-1.5 text-[clamp(1rem,2.5vw,1.1rem)] leading-relaxed text-slate-400 dark:text-slate-500">
                      {ex.translation}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {display.notes ? (
          <section
            className={[
              'border-t border-slate-100 pt-5 dark:border-slate-800 sm:pt-6',
              hasExamples ? 'mt-6' : 'mt-0',
            ].join(' ')}
          >
            <h2 className="mb-2.5 text-[13px] font-semibold text-slate-500 dark:text-slate-400">
              Notes
            </h2>
            <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-slate-600 dark:text-slate-300">
              {display.notes}
            </p>
          </section>
        ) : null}

        {hasMetadata ? (
          <footer className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
            {display.partOfSpeech ? (
              <p className="text-[14px] text-slate-400 dark:text-slate-500">
                {display.partOfSpeech}
              </p>
            ) : null}
          </footer>
        ) : null}
      </div>
    </article>
  )
}
