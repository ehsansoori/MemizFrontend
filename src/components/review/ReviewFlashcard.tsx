import type { SavedCard } from '@/types/cards'
import { ReviewAnswerDetails } from '@/components/review/ReviewAnswerDetails'

type ReviewFlashcardProps = {
  card: SavedCard
  showAnswer: boolean
}

export function ReviewFlashcard({ card, showAnswer }: ReviewFlashcardProps) {
  return (
    <div className="review-card-animate flex w-full max-w-lg flex-1 flex-col">
      <div
        className={[
          'flex min-h-[min(52dvh,420px)] w-full flex-col rounded-3xl border border-slate-200/90 bg-white shadow-card transition-shadow dark:border-slate-700/80 dark:bg-surface-900 dark:shadow-card-dark',
          showAnswer ? 'shadow-lg' : '',
        ].join(' ')}
      >
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {showAnswer ? 'Answer' : 'Question'}
          </p>
          <h2 className="font-display mt-4 text-[clamp(2rem,8vw,2.75rem)] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
            {card.data.word}
          </h2>
        </div>

        {showAnswer ? (
          <div className="max-h-[38dvh] overflow-y-auto border-t border-slate-100 px-5 py-5 scrollbar-minimal dark:border-slate-800">
            <ReviewAnswerDetails data={card.data} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
